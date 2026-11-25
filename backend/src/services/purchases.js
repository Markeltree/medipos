import { badRequest, conflict, notFound } from "../lib/http.js";
import { Medicine, Purchase, Supplier } from "../models/index.js";
import { logActivity, nextSequence } from "./common.js";
import { returnStock } from "./inventory.js";

export async function createPurchase(session, input, makeId) {
  const supplier = await Supplier.findById(input.supplierId).session(session).lean();
  if (!supplier) throw notFound("Supplier");
  const ids = input.items.map((i) => i.medicineId);
  if (new Set(ids).size !== ids.length) throw badRequest("Each medicine can appear only once in an order");
  const found = await Medicine.countDocuments({ _id: { $in: ids } }).session(session);
  if (found !== ids.length) throw badRequest("One or more medicines do not exist");

  let invoiceNumber = input.invoiceNumber?.trim();
  if (!invoiceNumber) {
    // Our own PO sequence, separate from supplier invoice numbers.
    const seq = await nextSequence(session, "purchaseOrder", async () => {
      const pos = await Purchase.find({ invoiceNumber: /^PO-\d+$/ }, { invoiceNumber: 1 }).session(session).lean();
      return pos.reduce((m, p) => Math.max(m, parseInt(p.invoiceNumber.slice(3), 10)), 0);
    });
    invoiceNumber = `PO-${String(seq).padStart(4, "0")}`;
  }

  const items = input.items.map((i) => ({ ...i, receivedQuantity: 0 }));
  const [purchase] = await Purchase.create(
    [
      {
        _id: input.id ?? makeId("pur"),
        supplierId: input.supplierId,
        invoiceNumber,
        purchaseDate: input.purchaseDate,
        expectedDelivery: input.expectedDelivery,
        status: input.status,
        paymentStatus: input.paymentStatus,
        items,
        total: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
        notes: input.notes,
      },
    ],
    { session },
  );
  const activity = await logActivity(session, `Purchase order ${invoiceNumber} created`, "purchase");
  return { purchases: [purchase.toJSON()], activity: [activity] };
}

/** Draft → Pending (sent to supplier); Draft or Pending → Cancelled. Receiving has its own endpoint. */
const ALLOWED = { Pending: ["Draft"], Cancelled: ["Draft", "Pending"] };

export async function setPurchaseStatus(session, id, status) {
  const purchase = await Purchase.findById(id).session(session);
  if (!purchase) throw notFound("Purchase order");
  if (!ALLOWED[status].includes(purchase.status)) {
    throw conflict(`A ${purchase.status.toLowerCase()} order cannot be set to ${status.toLowerCase()}`);
  }
  purchase.status = status;
  await purchase.save({ session });
  const activity = await logActivity(session, `Purchase order ${purchase.invoiceNumber} set to ${status}`, "purchase");
  return { purchases: [purchase.toJSON()], activity: [activity] };
}

/** Adds arrived quantities to stock, capped at what is still outstanding on each line. */
export async function receivePurchase(session, id, received, user) {
  const purchase = await Purchase.findById(id).session(session);
  if (!purchase) throw notFound("Purchase order");
  if (!["Pending", "Partially Received"].includes(purchase.status)) {
    throw conflict(`Stock cannot be received against a ${purchase.status.toLowerCase()} order`);
  }

  const added = [];
  for (const item of purchase.items) {
    const add = Math.max(0, Math.min(received[item.medicineId] ?? 0, item.quantity - item.receivedQuantity));
    item.receivedQuantity += add;
    if (add > 0) added.push({ medicineId: item.medicineId, quantity: add });
  }
  if (added.length === 0) throw badRequest("Enter at least one quantity received");

  const fully = purchase.items.every((it) => it.receivedQuantity >= it.quantity);
  purchase.status = fully ? "Received" : "Partially Received";
  await purchase.save({ session });

  const stock = await returnStock(session, added, { type: "Stock In", reference: purchase.invoiceNumber, user: user.name });
  const activity = await logActivity(session, `Stock received against ${purchase.invoiceNumber}`, "purchase");
  return { purchases: [purchase.toJSON()], ...stock, activity: [activity] };
}
