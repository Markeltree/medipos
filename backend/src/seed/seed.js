import bcrypt from "bcryptjs";
import {
  Activity, Category, Counter, Customer, Medicine, Prescription, Purchase, Sale, Staff, StockMovement, StoreProfile, Supplier,
} from "../models/index.js";
import * as data from "./data.js";
import { generateSales } from "./sales.js";

/*
 * Seeded records all get the same createdAt, and lists sort by createdAt then _id,
 * so the demo data keeps the order the frontend used to show.
 */
const SEEDED_AT = new Date("2026-01-01T00:00:00Z");

const withMongoId = ({ id, ...rest }) => ({ _id: id, ...rest, createdAt: SEEDED_AT, updatedAt: SEEDED_AT });

async function replace(Model, docs) {
  await Model.deleteMany({});
  // Native insert: the data is trusted and this keeps the fixed createdAt above.
  if (docs.length) await Model.collection.insertMany(docs.map(withMongoId));
}

/** Replaces all pharmacy data (catalogue, sales, purchases…) with the demo set. Staff accounts are untouched. */
export async function seedBusinessData() {
  const sales = generateSales();
  await replace(Category, data.categories);
  await replace(Supplier, data.suppliers);
  await replace(Medicine, data.medicines);
  await replace(Customer, data.customers);
  await replace(Purchase, data.purchases);
  await replace(Prescription, data.prescriptions);
  await replace(Sale, sales);
  await replace(Activity, data.activity);
  await StockMovement.deleteMany({});

  await StoreProfile.deleteMany({});
  await StoreProfile.create({ _id: "store", ...data.storeProfile });

  await Counter.deleteMany({});
  await Counter.create([{ _id: "sale", seq: sales.length }]);
  return { sales: sales.length };
}

/** Replaces all staff accounts with the demo team, every one using `password`. */
export async function seedStaff(password) {
  const passwordHash = await bcrypt.hash(password, 10);
  await Staff.deleteMany({});
  await Staff.collection.insertMany(data.staff.map((s) => ({ ...withMongoId(s), passwordHash })));
  return data.staff.map((s) => ({ email: s.email, role: s.role, status: s.status }));
}
