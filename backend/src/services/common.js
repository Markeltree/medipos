import { makeId } from "../lib/http.js";
import { Activity, Counter, StockMovement } from "../models/index.js";

export const nowIso = () => new Date().toISOString();

/** Writes an activity feed entry and returns it as JSON. */
export async function logActivity(session, message, kind) {
  const [doc] = await Activity.create([{ _id: makeId("act"), message, time: nowIso(), kind }], { session });
  return doc.toJSON();
}

/** Writes one stock movement (signed quantity) and returns it as JSON. */
export async function logMovement(session, { medicineId, type, quantity, reference, user }) {
  const [doc] = await StockMovement.create(
    [{ _id: makeId("mv"), medicineId, type, quantity, reference, date: nowIso(), user }],
    { session },
  );
  return doc.toJSON();
}

/**
 * Next number in a named sequence. If the counter does not exist yet, it starts
 * after the highest number already used (found by `currentMax`), so ids never collide.
 */
export async function nextSequence(session, name, currentMax) {
  let doc = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { new: true, session });
  if (!doc) {
    const start = await currentMax();
    doc = await Counter.findOneAndUpdate(
      { _id: name },
      { $setOnInsert: { seq: start + 1 } },
      { new: true, upsert: true, session },
    );
  }
  return doc.seq;
}

/** Highest number found in a string field, e.g. 1920 for "MP-001920". */
export async function maxNumberIn(Model, field, session) {
  const docs = await Model.find({}, { [field]: 1 }).session(session).lean();
  return docs.reduce((m, d) => {
    const n = parseInt(String(d[field]).replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
}
