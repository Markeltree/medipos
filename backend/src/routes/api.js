import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { HttpError, badRequest, conflict, inTransaction, makeId, notFound, parse, parsePatch } from "../lib/http.js";
import * as S from "../lib/schemas.js";
import { can, requireAuth, requireRole, signToken } from "../middleware/auth.js";
import {
  Activity, Category, Customer, Medicine, Prescription, Purchase, Sale, Staff, StockMovement, StoreProfile, Supplier,
} from "../models/index.js";
import { logActivity, logMovement } from "../services/common.js";
import { adjustStock } from "../services/inventory.js";
import { setPrescriptionStatus } from "../services/prescriptions.js";
import { createPurchase, receivePurchase, setPurchaseStatus } from "../services/purchases.js";
import { createSale, refundSale } from "../services/sales.js";
import { seedBusinessData } from "../seed/seed.js";

/*
 * Every write answers with { changes, removed }:
 *   changes: { medicines: [...], sales: [...], ... }  records created or updated, in full
 *   removed: { medicines: ["med-01"] }                ids deleted
 * so the frontend can merge them into its state without refetching everything.
 */
const send = (res, changes = {}, removed = {}, status = 200) => res.status(status).json({ changes, removed });

/* Sort orders match how the frontend lists records: newest first, except categories. */
const NEWEST = { createdAt: -1, _id: 1 };
const list = (Model, sort = NEWEST, filter = {}) => Model.find(filter).sort(sort);

const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", 10);

export function apiRouter(config) {
  const r = Router();
  const auth = requireAuth(config);
  const only = (roles) => [auth, requireRole(roles)];

  /* ---------- health and auth ---------- */

  r.get("/health", (_req, res) => res.json({ ok: true }));

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts. Try again in 15 minutes." },
  });

  r.post("/auth/login", loginLimiter, async (req, res) => {
    const { email, password } = parse(S.loginSchema, req.body);
    const staff = await Staff.findOne({ email }).select("+passwordHash");
    // Compare against a dummy hash when the email is unknown, so response time does not reveal which emails exist.
    const ok = await bcrypt.compare(password, staff?.passwordHash ?? DUMMY_HASH);
    if (!staff || !staff.passwordHash || !ok) throw new HttpError(401, "Email or password is incorrect");
    if (staff.status === "Inactive") throw new HttpError(403, "This account has been deactivated");
    res.json({ token: signToken(staff, config), user: staff.toJSON() });
  });

  r.get("/auth/me", auth, async (req, res) => {
    res.json({ user: (await Staff.findById(req.user.id)).toJSON() });
  });

  /** Everything the app needs after sign-in, in one request. */
  r.get("/bootstrap", auth, async (req, res) => {
    const [categories, medicines, suppliers, purchases, customers, sales, prescriptions, staff, movements, activity, profile] =
      await Promise.all([
        list(Category, { createdAt: 1, _id: 1 }),
        list(Medicine),
        list(Supplier),
        list(Purchase),
        list(Customer),
        list(Sale, { date: -1 }),
        list(Prescription),
        list(Staff),
        list(StockMovement, { date: -1 }).limit(500),
        list(Activity, { time: -1 }).limit(50),
        StoreProfile.findById("store"),
      ]);
    if (!profile) throw new Error("Store settings are missing. Run the seed script.");
    const me = staff.find((s) => s._id === req.user.id);
    res.json({ me, categories, medicines, suppliers, purchases, customers, sales, prescriptions, staff, movements, activity, profile });
  });

  /* ---------- plain reads ---------- */

  const reads = {
    categories: () => list(Category, { createdAt: 1, _id: 1 }),
    medicines: () => list(Medicine),
    suppliers: () => list(Supplier),
    purchases: () => list(Purchase),
    customers: () => list(Customer),
    sales: () => list(Sale, { date: -1 }),
    prescriptions: () => list(Prescription),
    staff: () => list(Staff),
    movements: () => list(StockMovement, { date: -1 }).limit(500),
    activity: () => list(Activity, { time: -1 }).limit(50),
  };
  for (const [path, query] of Object.entries(reads)) {
    r.get(`/${path}`, auth, async (_req, res) => res.json(await query()));
  }
  const byId = { categories: Category, medicines: Medicine, suppliers: Supplier, purchases: Purchase, customers: Customer, sales: Sale, prescriptions: Prescription, staff: Staff };
  for (const [path, Model] of Object.entries(byId)) {
    r.get(`/${path}/:id`, auth, async (req, res) => {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw notFound("Record");
      res.json(doc);
    });
  }

  /* ---------- categories ---------- */

  r.post("/categories", only(can.manageCatalogue), async (req, res) => {
    const { id, ...body } = parse(S.categorySchema, req.body);
    const doc = await Category.create({ _id: id ?? makeId("cat"), ...body });
    send(res, { categories: [doc.toJSON()] }, {}, 201);
  });
  r.patch("/categories/:id", only(can.manageCatalogue), async (req, res) => {
    const patch = parsePatch(S.categorySchema.omit({ id: true }).partial(), req.body);
    const doc = await Category.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!doc) throw notFound("Category");
    send(res, { categories: [doc.toJSON()] });
  });
  r.delete("/categories/:id", only(can.manageCatalogue), async (req, res) => {
    const inUse = await Medicine.countDocuments({ categoryId: req.params.id });
    if (inUse) throw conflict(`${inUse} medicine(s) still use this category. Move them first.`);
    const doc = await Category.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound("Category");
    send(res, {}, { categories: [doc._id] });
  });

  /* ---------- medicines and stock ---------- */

  r.post("/medicines", only(can.manageCatalogue), async (req, res) => {
    const { id, ...body } = parse(S.medicineCreateSchema, req.body);
    const changes = await inTransaction(async (session) => {
      const [doc] = await Medicine.create([{ _id: id ?? makeId("med"), ...body }], { session });
      const activity = await logActivity(session, `Medicine added: ${doc.name} ${doc.strength}`, "stock");
      return { medicines: [doc.toJSON()], activity: [activity] };
    });
    send(res, changes, {}, 201);
  });

  r.patch("/medicines/:id", only(can.manageCatalogue), async (req, res) => {
    const patch = parsePatch(S.medicineUpdateSchema, req.body);
    const changes = await inTransaction(async (session) => {
      const before = await Medicine.findById(req.params.id).session(session);
      if (!before) throw notFound("Medicine");
      const oldStock = before.stock;
      before.set(patch);
      await before.save({ session });
      const out = { medicines: [before.toJSON()] };
      // A stock edit in the catalogue form still leaves an audit trail.
      if (patch.stock !== undefined && patch.stock !== oldStock) {
        out.movements = [
          await logMovement(session, {
            medicineId: before._id, type: "Adjustment", quantity: patch.stock - oldStock, reference: "Edited in catalogue", user: req.user.name,
          }),
        ];
      }
      return out;
    });
    send(res, changes);
  });

  r.delete("/medicines/:id", only(can.manageCatalogue), async (req, res) => {
    const doc = await Medicine.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound("Medicine");
    send(res, {}, { medicines: [doc._id] });
  });

  r.post("/medicines/:id/adjust-stock", only(can.adjustStock), async (req, res) => {
    const body = parse(S.adjustStockSchema, req.body);
    const changes = await inTransaction((session) =>
      adjustStock(session, { medicineId: req.params.id, ...body, user: req.user.name }),
    );
    send(res, changes);
  });

  /* ---------- suppliers ---------- */

  r.post("/suppliers", only(can.manageSuppliers), async (req, res) => {
    const { id, ...body } = parse(S.supplierCreateSchema, req.body);
    const doc = await Supplier.create({ _id: id ?? makeId("sup"), ...body });
    send(res, { suppliers: [doc.toJSON()] }, {}, 201);
  });
  r.patch("/suppliers/:id", only(can.manageSuppliers), async (req, res) => {
    const patch = parsePatch(S.supplierUpdateSchema, req.body);
    const doc = await Supplier.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!doc) throw notFound("Supplier");
    send(res, { suppliers: [doc.toJSON()] });
  });
  r.delete("/suppliers/:id", only(can.manageSuppliers), async (req, res) => {
    const [meds, orders] = await Promise.all([
      Medicine.countDocuments({ supplierId: req.params.id }),
      Purchase.countDocuments({ supplierId: req.params.id }),
    ]);
    if (meds || orders) {
      throw conflict(`This supplier is linked to ${meds} medicine(s) and ${orders} purchase order(s). Set it to Inactive instead.`);
    }
    const doc = await Supplier.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound("Supplier");
    send(res, {}, { suppliers: [doc._id] });
  });

  /* ---------- purchases ---------- */

  r.post("/purchases", only(can.managePurchases), async (req, res) => {
    const body = parse(S.purchaseCreateSchema, req.body);
    send(res, await inTransaction((session) => createPurchase(session, body, makeId)), {}, 201);
  });
  r.patch("/purchases/:id/status", only(can.managePurchases), async (req, res) => {
    const { status } = parse(S.purchaseStatusSchema, req.body);
    send(res, await inTransaction((session) => setPurchaseStatus(session, req.params.id, status)));
  });
  r.post("/purchases/:id/receive", only(can.managePurchases), async (req, res) => {
    const { received } = parse(S.receivePurchaseSchema, req.body);
    send(res, await inTransaction((session) => receivePurchase(session, req.params.id, received, req.user)));
  });

  /* ---------- sales ---------- */

  r.post("/sales", only(can.sell), async (req, res) => {
    const body = parse(S.saleCreateSchema, req.body);
    send(res, await inTransaction((session) => createSale(session, body, req.user)), {}, 201);
  });
  r.post("/sales/:id/refund", only(can.refund), async (req, res) => {
    send(res, await inTransaction((session) => refundSale(session, req.params.id, req.user)));
  });

  /* ---------- customers ---------- */

  r.post("/customers", only(can.editCustomers), async (req, res) => {
    const { id, dateOfBirth, ...body } = parse(S.customerCreateSchema, req.body);
    const doc = await Customer.create({ _id: id ?? makeId("cus"), ...body, ...(dateOfBirth ? { dateOfBirth } : {}) });
    send(res, { customers: [doc.toJSON()] }, {}, 201);
  });
  r.patch("/customers/:id", only(can.editCustomers), async (req, res) => {
    const patch = parsePatch(S.customerUpdateSchema, req.body);
    const update = { $set: { ...patch } };
    if (patch.dateOfBirth === "") {
      delete update.$set.dateOfBirth;
      update.$unset = { dateOfBirth: 1 };
    }
    const doc = await Customer.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doc) throw notFound("Customer");
    send(res, { customers: [doc.toJSON()] });
  });
  r.post("/customers/:id/redeem", only(can.editCustomers), async (req, res) => {
    const { points } = parse(S.redeemSchema, req.body);
    const doc = await Customer.findOneAndUpdate(
      { _id: req.params.id, loyaltyPoints: { $gte: points } },
      { $inc: { loyaltyPoints: -points } },
      { new: true },
    );
    if (!doc) {
      if (!(await Customer.exists({ _id: req.params.id }))) throw notFound("Customer");
      throw conflict("The customer does not have enough points");
    }
    send(res, { customers: [doc.toJSON()] });
  });
  r.delete("/customers/:id", only(can.deleteCustomers), async (req, res) => {
    const doc = await Customer.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound("Customer");
    send(res, {}, { customers: [doc._id] });
  });

  /* ---------- prescriptions ---------- */

  r.post("/prescriptions", only(can.handlePrescriptions), async (req, res) => {
    const { id, ...body } = parse(S.prescriptionCreateSchema, req.body);
    const doc = await Prescription.create({ _id: id ?? makeId("rx"), ...body, status: "Pending" });
    send(res, { prescriptions: [doc.toJSON()] }, {}, 201);
  });
  r.patch("/prescriptions/:id/status", only(can.handlePrescriptions), async (req, res) => {
    const body = parse(S.prescriptionStatusSchema, req.body);
    send(res, await inTransaction((session) => setPrescriptionStatus(session, req.params.id, body, req.user)));
  });

  /* ---------- staff ---------- */

  r.post("/staff", only(can.manageStaff), async (req, res) => {
    const { id, password, ...body } = parse(S.staffCreateSchema, req.body);
    const doc = await Staff.create({ _id: id ?? makeId("stf"), ...body, passwordHash: await bcrypt.hash(password, 10) });
    send(res, { staff: [doc.toJSON()] }, {}, 201);
  });
  r.patch("/staff/:id", only(can.manageStaff), async (req, res) => {
    const { password, ...patch } = parsePatch(S.staffUpdateSchema, req.body);
    const self = req.params.id === req.user.id;
    if (self && ((patch.role && patch.role !== req.user.role) || (patch.status && patch.status !== "Active"))) {
      throw badRequest("You cannot change your own role or status. Ask another admin.");
    }
    if (password) patch.passwordHash = await bcrypt.hash(password, 10);
    const doc = await Staff.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!doc) throw notFound("Staff member");
    send(res, { staff: [doc.toJSON()] });
  });
  r.delete("/staff/:id", only(can.manageStaff), async (req, res) => {
    if (req.params.id === req.user.id) throw badRequest("You cannot delete your own account");
    const doc = await Staff.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound("Staff member");
    send(res, {}, { staff: [doc._id] });
  });

  /* ---------- settings ---------- */

  r.get("/settings", auth, async (_req, res) => res.json(await StoreProfile.findById("store")));
  r.patch("/settings", only(can.manageSettings), async (req, res) => {
    const { paymentsEnabled, ...patch } = parsePatch(S.profileUpdateSchema, req.body);
    const $set = { ...patch };
    // Merge payment toggles one by one so a partial object does not wipe the others.
    for (const [method, on] of Object.entries(paymentsEnabled ?? {})) $set[`paymentsEnabled.${method}`] = on;
    const doc = await StoreProfile.findByIdAndUpdate("store", { $set }, { new: true, runValidators: true });
    if (!doc) throw new Error("Store settings are missing. Run the seed script.");
    send(res, { profile: doc.toJSON() });
  });

  /** Wipes pharmacy data back to the demo set. Off unless ALLOW_DEMO_RESET=true; staff logins are kept. */
  r.post("/demo/reset", only(can.manageSettings), async (_req, res) => {
    if (!config.allowDemoReset) throw new HttpError(403, "Demo reset is turned off on this server");
    await seedBusinessData();
    res.json({ ok: true });
  });

  return r;
}
