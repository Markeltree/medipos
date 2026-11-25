import { conflict, notFound } from "../lib/http.js";
import { Prescription } from "../models/index.js";
import { logActivity } from "./common.js";
import { takeStock } from "./inventory.js";

/** Pending → Verified or Rejected; Verified → Dispensed or Rejected. Dispensed and Rejected are final. */
const ALLOWED = {
  Pending: [],
  Verified: ["Pending"],
  Rejected: ["Pending", "Verified"],
  Dispensed: ["Verified"],
};

export async function setPrescriptionStatus(session, id, { status, notes }, user) {
  const rx = await Prescription.findById(id).session(session);
  if (!rx) throw notFound("Prescription");
  if (!ALLOWED[status].includes(rx.status)) {
    throw conflict(`A ${rx.status.toLowerCase()} prescription cannot be marked ${status.toLowerCase()}`);
  }

  const changes = {};
  if (status === "Dispensed") {
    Object.assign(changes, await takeStock(session, rx.medicines, { type: "Stock Out", reference: `Dispensed ${id}`, user: user.name }));
  }
  rx.status = status;
  if (notes !== undefined) rx.notes = notes;
  await rx.save({ session });

  changes.prescriptions = [rx.toJSON()];
  changes.activity = [await logActivity(session, `Prescription ${id} marked ${status} by ${user.name}`, "prescription")];
  return changes;
}
