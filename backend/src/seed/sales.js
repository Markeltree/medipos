import { customers, medicines } from "./data.js";

/** Deterministic PRNG so generated sales are identical on every seed. */
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Builds ~180 days of counter sales ending 25 Nov 2026. Same output as the old frontend seed. */
export function generateSales() {
  const rand = rng(20261125);
  const methods = ["Cash", "Cash", "Card", "JazzCash", "EasyPaisa", "Bank Transfer"];
  const cashiers = ["Kashif Ali", "Bushra Jabeen", "Michael Carter"];
  const sales = [];
  const today = new Date("2026-11-25T20:00:00");
  let n = 0;
  for (let day = 179; day >= 0; day--) {
    const d = new Date(today);
    d.setDate(today.getDate() - day);
    const perDay = 6 + Math.floor(rand() * 9) + (d.getDay() === 5 ? 3 : 0);
    for (let k = 0; k < perDay; k++) {
      n++;
      const lineCount = 1 + Math.floor(rand() * 3);
      const items = [];
      const used = new Set();
      for (let l = 0; l < lineCount; l++) {
        const m = medicines[Math.floor(rand() * medicines.length)];
        if (used.has(m.id)) continue;
        used.add(m.id);
        items.push({
          medicineId: m.id,
          name: m.name,
          strength: m.strength,
          quantity: 1 + Math.floor(rand() * 3),
          unitPrice: m.sellingPrice,
          discount: 0,
        });
      }
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const tax = Math.round(subtotal * 0.17);
      const total = subtotal + tax;
      const hasCustomer = rand() > 0.35;
      const customer = hasCustomer ? customers[Math.floor(rand() * customers.length)] : null;
      const method = methods[Math.floor(rand() * methods.length)];
      const received = method === "Cash" ? Math.ceil(total / 100) * 100 : total;
      const date = new Date(d);
      date.setHours(9 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
      sales.push({
        id: `MP-${String(n).padStart(6, "0")}`,
        date: date.toISOString(),
        customerId: customer?.id ?? null,
        customerName: customer?.name ?? "Walk-in Customer",
        items,
        subtotal,
        discount: 0,
        tax,
        total,
        paymentMethod: method,
        amountReceived: received,
        change: received - total,
        cashier: cashiers[Math.floor(rand() * cashiers.length)],
        paymentStatus: "Paid",
      });
    }
  }
  return sales.reverse();
}
