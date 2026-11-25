"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  activity as seedActivity,
  categories as seedCategories,
  customers as seedCustomers,
  generateSales,
  medicines as seedMedicines,
  prescriptions as seedPrescriptions,
  purchases as seedPurchases,
  staff as seedStaff,
  storeProfile as seedProfile,
  suppliers as seedSuppliers,
} from "@/data/seed";
import type {
  ActivityItem,
  Category,
  Customer,
  Medicine,
  Prescription,
  PrescriptionStatus,
  Purchase,
  PurchaseStatus,
  Sale,
  StaffMember,
  StockMovement,
  StockMovementType,
  StoreProfile,
  Supplier,
} from "@/types";
import { makeId, nextInvoiceNumber } from "@/lib/utils";

export interface DataState {
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
  profile: StoreProfile;

  addActivity: (message: string, kind: ActivityItem["kind"]) => void;

  addMedicine: (data: Omit<Medicine, "id">) => string;
  updateMedicine: (id: string, data: Partial<Omit<Medicine, "id">>) => void;
  deleteMedicine: (id: string) => void;
  adjustStock: (medicineId: string, delta: number, type: StockMovementType, reference: string) => void;

  addCategory: (name: string, description: string) => void;
  updateCategory: (id: string, data: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;

  addSupplier: (data: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, data: Partial<Omit<Supplier, "id">>) => void;
  deleteSupplier: (id: string) => void;

  addPurchase: (data: Omit<Purchase, "id" | "invoiceNumber"> & { invoiceNumber?: string }) => string;
  updatePurchaseStatus: (id: string, status: PurchaseStatus) => void;
  receivePurchase: (id: string, received: Record<string, number>) => void;

  addSale: (sale: Omit<Sale, "id">) => string;
  refundSale: (id: string) => void;

  addCustomer: (data: Omit<Customer, "id" | "loyaltyPoints" | "totalPurchases" | "lastPurchase">) => string;
  updateCustomer: (id: string, data: Partial<Omit<Customer, "id">>) => void;
  deleteCustomer: (id: string) => void;

  updatePrescriptionStatus: (id: string, status: PrescriptionStatus, notes?: string) => void;

  addStaff: (data: Omit<StaffMember, "id">) => void;
  updateStaff: (id: string, data: Partial<Omit<StaffMember, "id">>) => void;
  deleteStaff: (id: string) => void;

  updateProfile: (data: Partial<StoreProfile>) => void;
  resetDemoData: () => void;
}

const seed = () => ({
  categories: seedCategories,
  medicines: seedMedicines,
  suppliers: seedSuppliers,
  purchases: seedPurchases,
  customers: seedCustomers,
  sales: generateSales(),
  prescriptions: seedPrescriptions,
  staff: seedStaff,
  movements: [] as StockMovement[],
  activity: seedActivity,
  profile: seedProfile,
});

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...seed(),

      addActivity: (message, kind) =>
        set((s) => ({
          activity: [{ id: makeId("act"), message, time: new Date().toISOString(), kind }, ...s.activity].slice(0, 50),
        })),

      addMedicine: (data) => {
        const id = makeId("med");
        set((s) => ({ medicines: [{ ...data, id }, ...s.medicines] }));
        get().addActivity(`Medicine added: ${data.name} ${data.strength}`, "stock");
        return id;
      },
      updateMedicine: (id, data) =>
        set((s) => ({ medicines: s.medicines.map((m) => (m.id === id ? { ...m, ...data } : m)) })),
      deleteMedicine: (id) => set((s) => ({ medicines: s.medicines.filter((m) => m.id !== id) })),

      adjustStock: (medicineId, delta, type, reference) => {
        const med = get().medicines.find((m) => m.id === medicineId);
        if (!med) return;
        const newStock = Math.max(0, med.stock + delta);
        const applied = newStock - med.stock;
        if (applied === 0) return;
        set((s) => ({
          medicines: s.medicines.map((m) => (m.id === medicineId ? { ...m, stock: newStock } : m)),
          movements: [
            { id: makeId("mv"), medicineId, type, quantity: applied, reference, date: new Date().toISOString(), user: "Shahid Mehmood" },
            ...s.movements,
          ],
        }));
      },

      addCategory: (name, description) =>
        set((s) => ({ categories: [...s.categories, { id: makeId("cat"), name, description }] })),
      updateCategory: (id, data) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addSupplier: (data) => set((s) => ({ suppliers: [{ ...data, id: makeId("sup") }, ...s.suppliers] })),
      updateSupplier: (id, data) =>
        set((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...data } : x)) })),
      deleteSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) })),

      addPurchase: (data) => {
        // Our own PO sequence, separate from supplier invoice numbers.
        const poNumbers = get()
          .purchases.map((p) => p.invoiceNumber)
          .filter((n) => n.startsWith("PO-"))
          .map((n) => parseInt(n.slice(3), 10))
          .filter((n) => !Number.isNaN(n));
        const invoiceNumber =
          data.invoiceNumber?.trim() || `PO-${String((poNumbers.length ? Math.max(...poNumbers) : 0) + 1).padStart(4, "0")}`;
        const id = makeId("pur");
        set((s) => ({ purchases: [{ ...data, id, invoiceNumber }, ...s.purchases] }));
        get().addActivity(`Purchase order ${invoiceNumber} created`, "purchase");
        return id;
      },
      updatePurchaseStatus: (id, status) => {
        set((s) => ({ purchases: s.purchases.map((p) => (p.id === id ? { ...p, status } : p)) }));
        get().addActivity(`Purchase order status set to ${status}`, "purchase");
      },
      receivePurchase: (id, received) => {
        const purchase = get().purchases.find((p) => p.id === id);
        if (!purchase) return;
        // Quantity actually added per medicine, capped at what is still outstanding.
        const addedBy = new Map<string, number>();
        const items = purchase.items.map((it) => {
          const add = Math.max(0, Math.min(received[it.medicineId] ?? 0, it.quantity - it.receivedQuantity));
          addedBy.set(it.medicineId, add);
          return { ...it, receivedQuantity: it.receivedQuantity + add };
        });
        const fullyReceived = items.every((it) => it.receivedQuantity >= it.quantity);
        const anyReceived = items.some((it) => it.receivedQuantity > 0);
        const status: PurchaseStatus = fullyReceived ? "Received" : anyReceived ? "Partially Received" : purchase.status;
        const receivedNow = purchase.items.filter((it) => (addedBy.get(it.medicineId) ?? 0) > 0);
        set((s) => ({
          purchases: s.purchases.map((p) => (p.id === id ? { ...p, items, status } : p)),
          medicines: s.medicines.map((m) => {
            const add = addedBy.get(m.id) ?? 0;
            return add > 0 ? { ...m, stock: m.stock + add } : m;
          }),
          movements: [
            ...receivedNow.map((it) => ({
              id: makeId("mv"),
              medicineId: it.medicineId,
              type: "Stock In" as const,
              quantity: addedBy.get(it.medicineId) ?? 0,
              reference: purchase.invoiceNumber,
              date: new Date().toISOString(),
              user: "Tariq Mahmood",
            })),
            ...s.movements,
          ],
        }));
        get().addActivity(`Stock received against ${purchase.invoiceNumber}`, "purchase");
      },

      addSale: (sale) => {
        const id = nextInvoiceNumber(
          get().sales.map((x) => x.id),
          get().profile.invoicePrefix,
        );
        const full: Sale = { ...sale, id };
        set((s) => {
          const qtyById = new Map<string, number>();
          sale.items.forEach((i) => qtyById.set(i.medicineId, (qtyById.get(i.medicineId) ?? 0) + i.quantity));
          const customers = sale.customerId
            ? s.customers.map((c) =>
                c.id === sale.customerId
                  ? {
                      ...c,
                      totalPurchases: c.totalPurchases + sale.total,
                      loyaltyPoints: c.loyaltyPoints + Math.floor(sale.total / 100),
                      lastPurchase: sale.date,
                    }
                  : c,
              )
            : s.customers;
          return {
            sales: [full, ...s.sales],
            customers,
            medicines: s.medicines.map((m) => {
              const q = qtyById.get(m.id);
              return q ? { ...m, stock: Math.max(0, m.stock - q) } : m;
            }),
          };
        });
        get().addActivity(`Sale ${id} completed for ${sale.customerName}`, "sale");
        return id;
      },
      refundSale: (id) => {
        const sale = get().sales.find((x) => x.id === id);
        if (!sale || sale.paymentStatus !== "Paid") return;
        set((s) => ({
          sales: s.sales.map((x) => (x.id === id ? { ...x, paymentStatus: "Refunded" } : x)),
          medicines: s.medicines.map((m) => {
            const line = sale.items.find((i) => i.medicineId === m.id);
            return line ? { ...m, stock: m.stock + line.quantity } : m;
          }),
        }));
        get().addActivity(`Sale ${id} refunded`, "sale");
      },

      addCustomer: (data) => {
        const id = makeId("cus");
        set((s) => ({
          customers: [{ ...data, id, loyaltyPoints: 0, totalPurchases: 0, lastPurchase: null }, ...s.customers],
        }));
        return id;
      },
      updateCustomer: (id, data) =>
        set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      updatePrescriptionStatus: (id, status, notes) => {
        const rx = get().prescriptions.find((p) => p.id === id);
        if (!rx) return;
        set((s) => ({
          prescriptions: s.prescriptions.map((p) =>
            p.id === id ? { ...p, status, notes: notes ?? p.notes } : p,
          ),
        }));
        if (status === "Dispensed" && rx.status !== "Dispensed") {
          rx.medicines.forEach((line) =>
            get().adjustStock(line.medicineId, -line.quantity, "Stock Out", `Dispensed ${id}`),
          );
        }
        get().addActivity(`Prescription ${id} marked ${status}`, "prescription");
      },

      addStaff: (data) => set((s) => ({ staff: [{ ...data, id: makeId("stf") }, ...s.staff] })),
      updateStaff: (id, data) => set((s) => ({ staff: s.staff.map((x) => (x.id === id ? { ...x, ...data } : x)) })),
      deleteStaff: (id) => set((s) => ({ staff: s.staff.filter((x) => x.id !== id) })),

      updateProfile: (data) => set((s) => ({ profile: { ...s.profile, ...data } })),
      resetDemoData: () => set({ ...seed() }),
    }),
    {
      name: "medipos-data",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
