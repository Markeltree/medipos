import { randomBytes } from "node:crypto";
import mongoose from "mongoose";

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new HttpError(400, msg, details);
export const notFound = (what) => new HttpError(404, `${what} not found`);
export const conflict = (msg) => new HttpError(409, msg);

/** Same shape as the frontend's makeId: "<prefix>-<random>". */
export function makeId(prefix) {
  return `${prefix}-${randomBytes(6).toString("hex")}`;
}

/** Parses a request part with a zod schema, or throws a 400 listing the problems. */
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    throw badRequest("Invalid request", details);
  }
  return result.data;
}

/**
 * For PATCH bodies: parses, then keeps only the keys the client actually sent.
 * Zod 4 applies .default() values even inside .partial(), which would overwrite unsent fields.
 */
export function parsePatch(schema, body) {
  const data = parse(schema, body ?? {});
  const sent = new Set(Object.keys(body ?? {}));
  const patch = Object.fromEntries(Object.entries(data).filter(([k]) => sent.has(k)));
  if (Object.keys(patch).length === 0) throw badRequest("Nothing to update");
  return patch;
}

/**
 * Runs fn inside a MongoDB transaction and returns its result.
 * The driver may retry fn on transient errors, so fn must not have side effects outside the session.
 */
export async function inTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
