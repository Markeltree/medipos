"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLine, HeldOrder } from "@/types";
import type { OrderDiscount } from "@/lib/utils";
import { makeId } from "@/lib/utils";

export interface PosState {
  cart: CartLine[];
  customerId: string | null;
  orderDiscount: OrderDiscount;
  heldOrders: HeldOrder[];

  addToCart: (medicineId: string, maxStock: number) => "added" | "limit" | "out";
  setQuantity: (medicineId: string, quantity: number, maxStock: number) => void;
  setLineDiscount: (medicineId: string, discount: number) => void;
  removeLine: (medicineId: string) => void;
  setCustomer: (customerId: string | null) => void;
  setOrderDiscount: (discount: OrderDiscount) => void;
  clearCart: () => void;
  holdOrder: (label?: string) => void;
  restoreHeld: (id: string) => void;
  deleteHeld: (id: string) => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      customerId: null,
      orderDiscount: { type: "percent", value: 0 },
      heldOrders: [],

      addToCart: (medicineId, maxStock) => {
        if (maxStock <= 0) return "out";
        const existing = get().cart.find((l) => l.medicineId === medicineId);
        if (existing) {
          if (existing.quantity >= maxStock) return "limit";
          set((s) => ({
            cart: s.cart.map((l) => (l.medicineId === medicineId ? { ...l, quantity: l.quantity + 1 } : l)),
          }));
          return "added";
        }
        set((s) => ({ cart: [...s.cart, { medicineId, quantity: 1, discount: 0 }] }));
        return "added";
      },
      setQuantity: (medicineId, quantity, maxStock) => {
        if (quantity <= 0) {
          get().removeLine(medicineId);
          return;
        }
        const clamped = Math.min(quantity, maxStock);
        set((s) => ({
          cart: s.cart.map((l) => (l.medicineId === medicineId ? { ...l, quantity: clamped } : l)),
        }));
      },
      setLineDiscount: (medicineId, discount) =>
        set((s) => ({
          cart: s.cart.map((l) => (l.medicineId === medicineId ? { ...l, discount: Math.max(0, discount) } : l)),
        })),
      removeLine: (medicineId) => set((s) => ({ cart: s.cart.filter((l) => l.medicineId !== medicineId) })),
      setCustomer: (customerId) => set({ customerId }),
      setOrderDiscount: (orderDiscount) => set({ orderDiscount }),
      clearCart: () => set({ cart: [], customerId: null, orderDiscount: { type: "percent", value: 0 } }),

      holdOrder: (label) => {
        const { cart, customerId, orderDiscount, heldOrders } = get();
        if (cart.length === 0) return;
        const held: HeldOrder = {
          id: makeId("hold"),
          label: label?.trim() || `Order ${heldOrders.length + 1}`,
          heldAt: new Date().toISOString(),
          customerId,
          cart,
          orderDiscount,
        };
        set({ heldOrders: [held, ...heldOrders].slice(0, 10), cart: [], customerId: null, orderDiscount: { type: "percent", value: 0 } });
      },
      restoreHeld: (id) => {
        const held = get().heldOrders.find((h) => h.id === id);
        if (!held) return;
        set((s) => ({
          cart: held.cart,
          customerId: held.customerId,
          orderDiscount: held.orderDiscount,
          heldOrders: s.heldOrders.filter((h) => h.id !== id),
        }));
      },
      deleteHeld: (id) => set((s) => ({ heldOrders: s.heldOrders.filter((h) => h.id !== id) })),
    }),
    {
      name: "medipos-pos",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
