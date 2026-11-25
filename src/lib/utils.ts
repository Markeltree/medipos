import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { BatchStatus, CartLine, Medicine } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const pkr = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

export function formatPKR(value: number) {
  return pkr.format(Math.round(value)).replace("PKR", "Rs").trim();
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PK").format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-PK", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatDate(value: string | Date, pattern = "dd MMM yyyy") {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, pattern);
}

export function formatDateTime(value: string | Date) {
  return formatDate(value, "dd MMM yyyy, HH:mm");
}

export function daysUntil(expiry: string, now: Date = new Date()) {
  return differenceInCalendarDays(parseISO(expiry), now);
}

export function expiryBucket(expiry: string, now?: Date) {
  const days = daysUntil(expiry, now);
  if (days < 0) return "expired" as const;
  if (days <= 30) return "30" as const;
  if (days <= 60) return "60" as const;
  if (days <= 90) return "90" as const;
  return "safe" as const;
}

/** Single status shown across the app. Expired and out-of-stock take priority. */
export function stockStatus(med: Pick<Medicine, "stock" | "minStock" | "expiryDate">, now?: Date): BatchStatus {
  const bucket = expiryBucket(med.expiryDate, now);
  if (bucket === "expired") return "Expired";
  if (med.stock === 0) return "Out of Stock";
  if (bucket === "30" || bucket === "60" || bucket === "90") return "Near Expiry";
  if (med.stock <= med.minStock) return "Low Stock";
  return "In Stock";
}

export const statusStyles: Record<BatchStatus, string> = {
  "In Stock": "bg-success-soft text-success",
  "Low Stock": "bg-warning-soft text-warning",
  "Out of Stock": "bg-danger-soft text-danger",
  "Near Expiry": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Expired: "bg-danger-soft text-danger",
};

/* ---------- Cart / checkout maths (pure, reusable) ---------- */

export interface OrderDiscount {
  type: "percent" | "fixed";
  value: number;
}

export interface CartTotals {
  subtotal: number; // sum of unit price x qty, before any discount
  lineDiscount: number; // sum of per-line fixed discounts
  orderDiscount: number; // percent or fixed discount on the whole order
  taxableAmount: number;
  tax: number;
  total: number;
  itemCount: number;
}

export function lineSubtotal(unitPrice: number, quantity: number, discount: number) {
  return Math.max(0, unitPrice * quantity - discount);
}

export function calcCartTotals(
  lines: (CartLine & { unitPrice: number })[],
  orderDiscount: OrderDiscount,
  taxRate: number,
  taxInclusive: boolean,
): CartTotals {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const lineDiscount = lines.reduce((s, l) => s + Math.min(l.discount, l.unitPrice * l.quantity), 0);
  const afterLines = subtotal - lineDiscount;
  const orderDiscountValue =
    orderDiscount.type === "percent"
      ? Math.round((afterLines * Math.min(orderDiscount.value, 100)) / 100)
      : Math.min(orderDiscount.value, afterLines);
  const taxableAmount = Math.max(0, afterLines - orderDiscountValue);
  const rate = taxRate / 100;
  const tax = taxInclusive
    ? Math.round(taxableAmount - taxableAmount / (1 + rate))
    : Math.round(taxableAmount * rate);
  const total = taxInclusive ? taxableAmount : taxableAmount + tax;
  return {
    subtotal,
    lineDiscount,
    orderDiscount: orderDiscountValue,
    taxableAmount,
    tax,
    total,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
  };
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function nextInvoiceNumber(existing: string[], prefix: string) {
  const max = existing.reduce((m, id) => {
    const n = parseInt(id.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(6, "0")}`;
}
