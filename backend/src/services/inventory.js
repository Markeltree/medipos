import { conflict, notFound } from "../lib/http.js";
import { Medicine } from "../models/index.js";
import { logActivity, logMovement } from "./common.js";

/**
 * Manual stock change. Like the original frontend, stock never goes below zero:
 * a removal larger than the stock on hand removes only what is there.
 */
export async function adjustStock(session, { medicineId, delta, type, reference, user }) {
  const med = await Medicine.findById(medicineId).session(session);
  if (!med) throw notFound("Medicine");
  const newStock = Math.max(0, med.stock + delta);
  const applied = newStock - med.stock;
  if (applied === 0) return { medicines: [med.toJSON()] };

  med.stock = newStock;
  await med.save({ session });
  const movement = await logMovement(session, { medicineId, type, quantity: applied, reference, user });
  return { medicines: [med.toJSON()], movements: [movement] };
}

/**
 * Takes exact quantities out of stock, failing the whole operation if any line is short.
 * Used for sales and dispensing, where clamping would hide a real shortage.
 */
export async function takeStock(session, lines, { type, reference, user }) {
  const medicines = [];
  const movements = [];
  for (const { medicineId, quantity } of lines) {
    const med = await Medicine.findOneAndUpdate(
      { _id: medicineId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true, session },
    );
    if (!med) {
      const exists = await Medicine.findById(medicineId).session(session).lean();
      if (!exists) throw notFound(`Medicine ${medicineId}`);
      throw conflict(`Not enough stock for ${exists.name}: ${exists.stock} left, ${quantity} needed`);
    }
    medicines.push(med.toJSON());
    movements.push(await logMovement(session, { medicineId, type, quantity: -quantity, reference, user }));
  }
  return { medicines, movements };
}

/** Puts quantities back into stock (refunds, purchase receipts). */
export async function returnStock(session, lines, { type, reference, user }) {
  const medicines = [];
  const movements = [];
  for (const { medicineId, quantity } of lines) {
    if (quantity <= 0) continue;
    const med = await Medicine.findByIdAndUpdate(medicineId, { $inc: { stock: quantity } }, { new: true, session });
    if (!med) continue; // medicine deleted since: nothing to restock
    medicines.push(med.toJSON());
    movements.push(await logMovement(session, { medicineId, type, quantity, reference, user }));
  }
  return { medicines, movements };
}

export async function lowStockAlert(session, medicine) {
  if (medicine.stock > medicine.minStock) return null;
  return logActivity(session, `Low stock alert: ${medicine.name} (${medicine.stock} left)`, "stock");
}
