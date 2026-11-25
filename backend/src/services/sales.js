import { badRequest, conflict, notFound } from "../lib/http.js";
import { Customer, Medicine, Sale, StoreProfile } from "../models/index.js";
import { logActivity, maxNumberIn, nextSequence, nowIso } from "./common.js";
import { returnStock, takeStock } from "./inventory.js";

/** Same maths as calcCartTotals in the frontend's src/lib/utils.ts. */
export function calcTotals(lines, orderDiscount, taxRate, taxInclusive) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const lineDiscount = lines.reduce((s, l) => s + Math.min(l.discount, l.unitPrice * l.quantity), 0);
  const afterLines = subtotal - lineDiscount;
  const orderDiscountValue =
    orderDiscount.type === "percent"
      ? Math.round((afterLines * Math.min(orderDiscount.value, 100)) / 100)
      : Math.min(orderDiscount.value, afterLines);
  const taxableAmount = Math.max(0, afterLines - orderDiscountValue);
  const rate = taxRate / 100;
  const tax = taxInclusive ? Math.round(taxableAmount - taxableAmount / (1 + rate)) : Math.round(taxableAmount * rate);
  const total = taxInclusive ? taxableAmount : taxableAmount + tax;
  return { subtotal, lineDiscount, orderDiscount: orderDiscountValue, taxableAmount, tax, total };
}

/**
 * Records a counter sale. Prices, tax and totals come from the database, never from the client.
 * Stock is taken atomically; if any line is short the whole sale is rolled back.
 */
export async function createSale(session, input, user) {
  const profile = await StoreProfile.findById("store").session(session);
  if (!profile) throw new Error("Store settings are missing. Run the seed script.");
  if (!profile.paymentsEnabled?.[input.paymentMethod]) {
    throw badRequest(`${input.paymentMethod} payments are turned off in Settings`);
  }

  const ids = input.items.map((i) => i.medicineId);
  if (new Set(ids).size !== ids.length) throw badRequest("Each medicine can appear only once in a sale");
  const meds = await Medicine.find({ _id: { $in: ids } }).session(session).lean();
  const byId = new Map(meds.map((m) => [m._id, m]));

  const items = input.items.map((i) => {
    const med = byId.get(i.medicineId);
    if (!med) throw notFound(`Medicine ${i.medicineId}`);
    const gross = med.sellingPrice * i.quantity;
    return {
      medicineId: med._id,
      name: med.name,
      strength: med.strength,
      quantity: i.quantity,
      unitPrice: med.sellingPrice,
      discount: Math.min(i.discount, gross),
    };
  });

  const totals = calcTotals(items, input.orderDiscount, profile.taxRate, profile.taxInclusive);
  const isCash = input.paymentMethod === "Cash";
  const amountReceived = isCash ? (input.amountReceived ?? totals.total) : totals.total;
  if (isCash && amountReceived < totals.total) throw badRequest("Amount received is less than the total payable");

  let customer = null;
  if (input.customerId) {
    customer = await Customer.findById(input.customerId).session(session);
    if (!customer) throw notFound("Customer");
  }

  const seq = await nextSequence(session, "sale", () => maxNumberIn(Sale, "_id", session));
  const id = `${profile.invoicePrefix}-${String(seq).padStart(6, "0")}`;
  const date = nowIso();

  const stock = await takeStock(session, items, { type: "Sale", reference: id, user: user.name });

  const [sale] = await Sale.create(
    [
      {
        _id: id,
        date,
        customerId: customer?._id ?? null,
        customerName: customer?.name ?? "Walk-in Customer",
        items,
        subtotal: totals.subtotal,
        discount: totals.lineDiscount + totals.orderDiscount,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: input.paymentMethod,
        amountReceived,
        change: isCash ? amountReceived - totals.total : 0,
        cashier: user.name,
        paymentStatus: "Paid",
      },
    ],
    { session },
  );

  const changes = { sales: [sale.toJSON()], ...stock, activity: [] };
  if (customer) {
    customer.totalPurchases += totals.total;
    customer.loyaltyPoints += Math.floor(totals.total / 100);
    customer.lastPurchase = date;
    await customer.save({ session });
    changes.customers = [customer.toJSON()];
  }
  changes.activity.push(await logActivity(session, `Sale ${id} completed for ${sale.customerName}`, "sale"));
  return changes;
}

/** Full refund: items go back to stock and the customer's totals and points are reversed. */
export async function refundSale(session, id, user) {
  const sale = await Sale.findById(id).session(session);
  if (!sale) throw notFound("Sale");
  if (sale.paymentStatus !== "Paid") throw conflict(`Sale ${id} is already ${sale.paymentStatus.toLowerCase()}`);

  sale.paymentStatus = "Refunded";
  await sale.save({ session });
  const stock = await returnStock(session, sale.items, { type: "Return", reference: `Refund ${id}`, user: user.name });

  const changes = { sales: [sale.toJSON()], ...stock };
  if (sale.customerId) {
    const customer = await Customer.findById(sale.customerId).session(session);
    if (customer) {
      customer.totalPurchases = Math.max(0, customer.totalPurchases - sale.total);
      customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - Math.floor(sale.total / 100));
      await customer.save({ session });
      changes.customers = [customer.toJSON()];
    }
  }
  changes.activity = [await logActivity(session, `Sale ${id} refunded by ${user.name}`, "sale")];
  return changes;
}
