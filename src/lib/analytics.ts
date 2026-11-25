import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import type { Category, Medicine, Sale, StockMovement, Purchase } from "@/types";
import { expiryBucket } from "@/lib/utils";

/* Pure selectors. All reporting numbers come from here so pages stay consistent. */

export function saleRevenue(sales: Sale[]) {
  return sales.filter((s) => s.paymentStatus === "Paid").reduce((sum, s) => sum + s.total, 0);
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function salesBetween(sales: Sale[], from: Date, to: Date) {
  return sales.filter((s) => isWithinInterval(new Date(s.date), { start: from, end: to }));
}

export function dailySeries(sales: Sale[], days: number, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const day = subDays(startOfDay(now), days - 1 - i);
    const todays = sales.filter((s) => isSameDay(new Date(s.date), day) && s.paymentStatus === "Paid");
    return {
      label: format(day, "dd MMM"),
      short: format(day, "EEE"),
      revenue: todays.reduce((sum, s) => sum + s.total, 0),
      orders: todays.length,
    };
  });
}

export function monthlySeries(sales: Sale[], months: number, now = new Date()) {
  return Array.from({ length: months }, (_, i) => {
    const start = startOfMonth(addMonths(now, i - (months - 1)));
    const end = addDays(addMonths(start, 1), -1);
    const inMonth = salesBetween(sales, start, end).filter((s) => s.paymentStatus === "Paid");
    return {
      label: format(start, "MMM yy"),
      revenue: inMonth.reduce((sum, s) => sum + s.total, 0),
      orders: inMonth.length,
    };
  });
}

export function categoryShare(sales: Sale[], medicines: Medicine[], categories: Category[]) {
  const catByMed = new Map(medicines.map((m) => [m.id, m.categoryId]));
  const totals = new Map<string, number>();
  sales
    .filter((s) => s.paymentStatus === "Paid")
    .forEach((s) =>
      s.items.forEach((i) => {
        const cat = catByMed.get(i.medicineId) ?? "unknown";
        totals.set(cat, (totals.get(cat) ?? 0) + i.unitPrice * i.quantity);
      }),
    );
  const nameOf = (id: string) => categories.find((c) => c.id === id)?.name ?? "Other";
  return [...totals.entries()]
    .map(([id, value]) => ({ name: nameOf(id), value }))
    .sort((a, b) => b.value - a.value);
}

export function topSellers(sales: Sale[], limit = 5) {
  const map = new Map<string, { name: string; strength: string; qty: number; revenue: number }>();
  sales
    .filter((s) => s.paymentStatus === "Paid")
    .forEach((s) =>
      s.items.forEach((i) => {
        const cur = map.get(i.medicineId) ?? { name: i.name, strength: i.strength, qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue += i.unitPrice * i.quantity;
        map.set(i.medicineId, cur);
      }),
    );
  return [...map.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit);
}

export function inventoryValuation(medicines: Medicine[]) {
  const cost = medicines.reduce((s, m) => s + m.purchasePrice * m.stock, 0);
  const retail = medicines.reduce((s, m) => s + m.sellingPrice * m.stock, 0);
  return { cost, retail, potentialMargin: retail - cost };
}

export function expiryGroups(medicines: Medicine[]) {
  return {
    expired: medicines.filter((m) => expiryBucket(m.expiryDate) === "expired"),
    d30: medicines.filter((m) => expiryBucket(m.expiryDate) === "30"),
    d60: medicines.filter((m) => expiryBucket(m.expiryDate) === "60"),
    d90: medicines.filter((m) => expiryBucket(m.expiryDate) === "90"),
  };
}

/** Stock history for one product, merging received purchases, sales and manual movements. */
export function stockHistory(
  medicineId: string,
  purchases: Purchase[],
  sales: Sale[],
  movements: StockMovement[],
) {
  const rows: { id: string; date: string; type: string; quantity: number; reference: string }[] = [];
  purchases.forEach((p) =>
    p.items
      .filter((i) => i.medicineId === medicineId && i.receivedQuantity > 0)
      .forEach((i) =>
        rows.push({ id: `${p.id}-${i.medicineId}`, date: p.expectedDelivery, type: "Stock In", quantity: i.receivedQuantity, reference: p.invoiceNumber }),
      ),
  );
  sales.forEach((s) =>
    s.items
      .filter((i) => i.medicineId === medicineId)
      .forEach((i) =>
        rows.push({
          id: `${s.id}-${i.medicineId}`,
          date: s.date,
          type: s.paymentStatus === "Refunded" ? "Return" : "Sale",
          quantity: s.paymentStatus === "Refunded" ? i.quantity : -i.quantity,
          reference: s.id,
        }),
      ),
  );
  movements
    .filter((m) => m.medicineId === medicineId)
    .forEach((m) => rows.push({ id: m.id, date: m.date, type: m.type, quantity: m.quantity, reference: m.reference }));
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}
