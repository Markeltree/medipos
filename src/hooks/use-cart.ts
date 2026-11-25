"use client";

import * as React from "react";
import { calcCartTotals, type CartTotals } from "@/lib/utils";
import { useDataStore } from "@/store/data-store";
import { usePosStore } from "@/store/pos-store";
import type { Customer, Medicine, SaleItem } from "@/types";

export interface CartLineView {
  medicineId: string;
  quantity: number;
  discount: number;
  medicine: Medicine;
  lineTotal: number;
}

/**
 * Joins the persisted cart with live medicine records and derives totals.
 * Lines whose medicine was deleted are dropped from the view.
 */
export function useCart() {
  const cart = usePosStore((s) => s.cart);
  const customerId = usePosStore((s) => s.customerId);
  const orderDiscount = usePosStore((s) => s.orderDiscount);
  const medicines = useDataStore((s) => s.medicines);
  const customers = useDataStore((s) => s.customers);
  const profile = useDataStore((s) => s.profile);

  const lines = React.useMemo<CartLineView[]>(() => {
    return cart
      .map((l) => {
        const medicine = medicines.find((m) => m.id === l.medicineId);
        if (!medicine) return null;
        const gross = medicine.sellingPrice * l.quantity;
        return {
          medicineId: l.medicineId,
          quantity: l.quantity,
          discount: Math.min(l.discount, gross),
          medicine,
          lineTotal: gross - Math.min(l.discount, gross),
        };
      })
      .filter((l): l is CartLineView => l !== null);
  }, [cart, medicines]);

  const totals: CartTotals = React.useMemo(
    () =>
      calcCartTotals(
        lines.map((l) => ({
          medicineId: l.medicineId,
          quantity: l.quantity,
          discount: l.discount,
          unitPrice: l.medicine.sellingPrice,
        })),
        orderDiscount,
        profile.taxRate,
        profile.taxInclusive,
      ),
    [lines, orderDiscount, profile.taxRate, profile.taxInclusive],
  );

  const customer: Pick<Customer, "id" | "name"> | null = React.useMemo(() => {
    const c = customers.find((x) => x.id === customerId);
    return c ? { id: c.id, name: c.name } : null;
  }, [customers, customerId]);

  const saleItems: SaleItem[] = React.useMemo(
    () =>
      lines.map((l) => ({
        medicineId: l.medicineId,
        name: l.medicine.name,
        strength: l.medicine.strength,
        quantity: l.quantity,
        unitPrice: l.medicine.sellingPrice,
        discount: l.discount,
      })),
    [lines],
  );

  /** Lines that ask for more stock than is on the shelf. */
  const overStock = lines.filter((l) => l.quantity > l.medicine.stock);

  return { lines, totals, customer, saleItems, overStock, customers };
}
