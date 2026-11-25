"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { makeId } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type {
  ActivityItem,
  Category,
  Customer,
  Medicine,
  PaymentMethod,
  Prescription,
  PrescriptionStatus,
  Purchase,
  Sale,
  StaffMember,
  StockMovement,
  StockMovementType,
  StoreProfile,
  Supplier,
} from "@/types";
import type { OrderDiscount } from "@/lib/utils";

/*
 * Client-side copy of the pharmacy data, loaded from the backend after sign-in.
 *
 * Simple edits (create/update/delete of a record) are applied here first so the UI
 * responds instantly, then sent to the server; if the server refuses, the error is
 * shown and the data is reloaded. Anything the server calculates (sales, refunds,
 * stock, purchase receipts, dispensing) waits for the server's answer instead.
 * Every write returns { changes, removed }, which is merged in with applyChanges.
 */

interface Collections {
  categories: Category[];
  medicines: Medicine[];
  suppliers: Supplier[];
  purchases: Purchase[];
  customers: Customer[];
  sales: Sale[];
  prescriptions: Prescription[];
  staff: StaffMember[];
  movements: StockMovement[];
  activity: ActivityItem[];
}
type Key = keyof Collections;

export type Changes = { [K in Key]?: Collections[K] } & { profile?: StoreProfile };
export type Removed = { [K in Key]?: string[] };
interface WriteResult {
  changes: Changes;
  removed: Removed;
}

export interface NewSale {
  customerId: string | null;
  items: { medicineId: string; quantity: number; discount: number }[];
  orderDiscount: OrderDiscount;
  paymentMethod: PaymentMethod;
  amountReceived?: number;
}

export type NewStaffMember = Omit<StaffMember, "id"> & { password: string };
export type StaffUpdate = Partial<Omit<StaffMember, "id">> & { password?: string };

export interface DataState extends Collections {
  profile: StoreProfile;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;

  load: () => Promise<void>;
  clear: () => void;
  applyChanges: (changes: Changes, removed?: Removed) => void;

  addMedicine: (data: Omit<Medicine, "id">) => string;
  updateMedicine: (id: string, data: Partial<Omit<Medicine, "id">>) => Promise<boolean>;
  deleteMedicine: (id: string) => Promise<boolean>;
  adjustStock: (medicineId: string, delta: number, type: StockMovementType, reference: string) => Promise<boolean>;

  addCategory: (name: string, description: string) => Promise<boolean>;
  updateCategory: (id: string, data: Partial<Omit<Category, "id">>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  addSupplier: (data: Omit<Supplier, "id">) => Promise<boolean>;
  updateSupplier: (id: string, data: Partial<Omit<Supplier, "id">>) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;

  addPurchase: (
    data: Omit<Purchase, "id" | "invoiceNumber" | "total" | "items"> & {
      invoiceNumber?: string;
      items: { medicineId: string; quantity: number; unitPrice: number }[];
    },
  ) => Promise<boolean>;
  updatePurchaseStatus: (id: string, status: "Pending" | "Cancelled") => Promise<boolean>;
  receivePurchase: (id: string, received: Record<string, number>) => Promise<boolean>;

  addSale: (sale: NewSale) => Promise<Sale | null>;
  refundSale: (id: string) => Promise<boolean>;

  addCustomer: (data: Omit<Customer, "id" | "loyaltyPoints" | "totalPurchases" | "lastPurchase">) => string;
  updateCustomer: (id: string, data: Partial<Omit<Customer, "id" | "loyaltyPoints" | "totalPurchases" | "lastPurchase">>) => Promise<boolean>;
  redeemPoints: (id: string, points: number) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;

  updatePrescriptionStatus: (id: string, status: PrescriptionStatus, notes?: string) => Promise<boolean>;

  addStaff: (data: NewStaffMember) => Promise<boolean>;
  updateStaff: (id: string, data: StaffUpdate) => Promise<boolean>;
  deleteStaff: (id: string) => Promise<boolean>;

  updateProfile: (data: Partial<StoreProfile>) => Promise<boolean>;
  resetDemoData: () => Promise<boolean>;
}

/** Placeholder until the server's settings arrive. The dashboard does not render before then. */
const emptyProfile: StoreProfile = {
  pharmacyName: "",
  legalName: "",
  licenseNumber: "",
  ntn: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  currency: "PKR",
  timezone: "Asia/Karachi",
  taxRate: 0,
  taxInclusive: false,
  invoicePrefix: "MP",
  invoiceFooter: "",
  receiptPaperWidth: "80mm",
  lowStockAlerts: true,
  expiryAlerts: true,
  dailySummaryEmail: false,
  paymentsEnabled: { Cash: true, Card: true, "Bank Transfer": true, JazzCash: true, EasyPaisa: true },
};

const empty = (): Collections & { profile: StoreProfile } => ({
  categories: [],
  medicines: [],
  suppliers: [],
  purchases: [],
  customers: [],
  sales: [],
  prescriptions: [],
  staff: [],
  movements: [],
  activity: [],
  profile: emptyProfile,
});

/** New records go first in every list except categories, which the app lists in creation order. */
const APPEND: ReadonlySet<Key> = new Set(["categories"]);

function upsert<T extends { id: string }>(list: T[], incoming: T[], append: boolean): T[] {
  if (!incoming.length) return list;
  const byId = new Map(incoming.map((x) => [x.id, x]));
  const updated = list.map((x) => byId.get(x.id) ?? x);
  const known = new Set(list.map((x) => x.id));
  const added = incoming.filter((x) => !known.has(x.id));
  return append ? [...updated, ...added] : [...added, ...updated];
}

function errorMessage(err: unknown) {
  return err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong";
}

export const useDataStore = create<DataState>()((set, get) => {
  /** Sends a write and merges the server's answer. Shows the error and returns null on failure. */
  async function write(path: string, method: string, body?: unknown): Promise<WriteResult | null> {
    try {
      const res = await api<Partial<WriteResult>>(path, { method, body });
      const result = { changes: res.changes ?? {}, removed: res.removed ?? {} };
      get().applyChanges(result.changes, result.removed);
      return result;
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) toast.error(errorMessage(err));
      return null;
    }
  }

  /** Applies a local change now, then confirms it with the server; reloads if the server refuses. */
  async function optimistic(local: (s: DataState) => Partial<DataState>, path: string, method: string, body?: unknown) {
    set(local);
    const res = await write(path, method, body);
    if (!res && get().status === "ready") void get().load();
    return res !== null;
  }

  return {
    ...empty(),
    status: "idle",
    error: null,

    load: async () => {
      set({ status: "loading", error: null });
      try {
        const { me, ...data } = await api<Collections & { profile: StoreProfile; me: StaffMember }>("/bootstrap");
        useAuthStore.getState().setUser(me);
        set({ ...data, status: "ready" });
      } catch (err) {
        set({ status: "error", error: errorMessage(err) });
      }
    },

    clear: () => set({ ...empty(), status: "idle", error: null }),

    applyChanges: (changes, removed = {}) =>
      set((s) => {
        const next: Partial<DataState> = {};
        for (const key of Object.keys(changes) as (Key | "profile")[]) {
          if (key === "profile") next.profile = changes.profile;
          else (next as Record<Key, unknown>)[key] = upsert(s[key] as { id: string }[], changes[key] as { id: string }[], APPEND.has(key));
        }
        for (const key of Object.keys(removed) as Key[]) {
          const gone = new Set(removed[key]);
          const current = (next[key] ?? s[key]) as { id: string }[];
          (next as Record<Key, unknown>)[key] = current.filter((x) => !gone.has(x.id));
        }
        // Keep the feed short, as the server does.
        if (next.activity) next.activity = next.activity.slice(0, 50);
        return next;
      }),

    /* ---------- catalogue ---------- */

    addMedicine: (data) => {
      const id = makeId("med");
      void optimistic((s) => ({ medicines: [{ ...data, id }, ...s.medicines] }), "/medicines", "POST", { ...data, id });
      return id;
    },
    updateMedicine: (id, data) =>
      optimistic((s) => ({ medicines: s.medicines.map((m) => (m.id === id ? { ...m, ...data } : m)) }), `/medicines/${id}`, "PATCH", data),
    deleteMedicine: (id) =>
      optimistic((s) => ({ medicines: s.medicines.filter((m) => m.id !== id) }), `/medicines/${id}`, "DELETE"),
    adjustStock: async (medicineId, delta, type, reference) =>
      (await write(`/medicines/${medicineId}/adjust-stock`, "POST", { delta, type, reference })) !== null,

    addCategory: (name, description) => {
      const id = makeId("cat");
      return optimistic((s) => ({ categories: [...s.categories, { id, name, description }] }), "/categories", "POST", { id, name, description });
    },
    updateCategory: (id, data) =>
      optimistic((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)) }), `/categories/${id}`, "PATCH", data),
    deleteCategory: (id) =>
      optimistic((s) => ({ categories: s.categories.filter((c) => c.id !== id) }), `/categories/${id}`, "DELETE"),

    addSupplier: (data) => {
      const id = makeId("sup");
      return optimistic((s) => ({ suppliers: [{ ...data, id }, ...s.suppliers] }), "/suppliers", "POST", { ...data, id });
    },
    updateSupplier: (id, data) =>
      optimistic((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...data } : x)) }), `/suppliers/${id}`, "PATCH", data),
    deleteSupplier: (id) =>
      optimistic((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) }), `/suppliers/${id}`, "DELETE"),

    /* ---------- purchases ---------- */

    addPurchase: async (data) => (await write("/purchases", "POST", data)) !== null,
    updatePurchaseStatus: async (id, status) => (await write(`/purchases/${id}/status`, "PATCH", { status })) !== null,
    receivePurchase: async (id, received) => (await write(`/purchases/${id}/receive`, "POST", { received })) !== null,

    /* ---------- sales ---------- */

    addSale: async (sale) => (await write("/sales", "POST", sale))?.changes.sales?.[0] ?? null,
    refundSale: async (id) => (await write(`/sales/${id}/refund`, "POST")) !== null,

    /* ---------- customers ---------- */

    addCustomer: (data) => {
      const id = makeId("cus");
      void optimistic(
        (s) => ({ customers: [{ ...data, id, loyaltyPoints: 0, totalPurchases: 0, lastPurchase: null }, ...s.customers] }),
        "/customers",
        "POST",
        { ...data, id },
      );
      return id;
    },
    updateCustomer: (id, data) =>
      optimistic((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)) }), `/customers/${id}`, "PATCH", data),
    redeemPoints: async (id, points) => (await write(`/customers/${id}/redeem`, "POST", { points })) !== null,
    deleteCustomer: (id) =>
      optimistic((s) => ({ customers: s.customers.filter((c) => c.id !== id) }), `/customers/${id}`, "DELETE"),

    /* ---------- prescriptions ---------- */

    updatePrescriptionStatus: async (id, status, notes) =>
      (await write(`/prescriptions/${id}/status`, "PATCH", notes === undefined ? { status } : { status, notes })) !== null,

    /* ---------- staff and settings ---------- */

    addStaff: ({ password, ...data }) => {
      const id = makeId("stf");
      return optimistic((s) => ({ staff: [{ ...data, id }, ...s.staff] }), "/staff", "POST", { ...data, id, password });
    },
    updateStaff: (id, { password, ...data }) =>
      optimistic(
        (s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, ...data } : x)) }),
        `/staff/${id}`,
        "PATCH",
        password ? { ...data, password } : data,
      ),
    deleteStaff: (id) => optimistic((s) => ({ staff: s.staff.filter((x) => x.id !== id) }), `/staff/${id}`, "DELETE"),

    updateProfile: (data) => optimistic((s) => ({ profile: { ...s.profile, ...data } }), "/settings", "PATCH", data),
    resetDemoData: async () => {
      const ok = (await write("/demo/reset", "POST")) !== null;
      if (ok) await get().load();
      return ok;
    },
  };
});

// Signing out (or an expired session) drops the cached pharmacy data.
useAuthStore.subscribe((s, prev) => {
  if (prev.token && !s.token) useDataStore.getState().clear();
});
