import { z } from "zod";
import {
  DOSAGE_FORMS, MOVEMENT_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES, ROLES, RX_STATUSES, STAFF_STATUSES,
} from "../models/index.js";

/* Request body schemas. Objects are strict, so unknown keys (including Mongo operators) are rejected. */

const text = (max) => z.string().trim().max(max);
const required = (max, msg = "Required") => z.string().trim().min(1, msg).max(max);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a yyyy-mm-dd date");
const money = z.number().finite().min(0);
const count = z.number().int().min(0);
const ref = z.string().trim().min(1).max(60);
const email = z.string().trim().max(120).refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email");
/** Optional client-chosen id in the frontend's makeId format, so the UI can show the record before the server answers. */
const clientId = z.string().regex(/^[A-Za-z]{2,4}-[A-Za-z0-9-]{2,40}$/, "Invalid id").optional();

export const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(120),
  password: z.string().min(1).max(128),
});

export const categorySchema = z.strictObject({
  id: clientId,
  name: required(80),
  description: text(300).default(""),
});

const medicineFields = {
  name: required(120),
  genericName: required(160),
  brand: text(60).default(""),
  sku: z.string().trim().regex(/^[A-Za-z0-9-]{3,20}$/, "3–20 letters, numbers or dashes"),
  barcode: z.string().trim().regex(/^(\d{8,14})?$/, "Barcode must be 8–14 digits").default(""),
  categoryId: ref,
  dosageForm: z.enum(DOSAGE_FORMS),
  strength: required(40),
  manufacturer: text(120).default(""),
  batchNumber: text(40).default(""),
  purchasePrice: money,
  sellingPrice: money,
  stock: count,
  minStock: count,
  expiryDate: date,
  prescriptionRequired: z.boolean().default(false),
  description: text(300).default(""),
  supplierId: ref,
  image: z.string().max(500_000).optional(),
};
export const medicineCreateSchema = z.strictObject({ id: clientId, ...medicineFields });
export const medicineUpdateSchema = z.strictObject(medicineFields).partial();

export const adjustStockSchema = z.strictObject({
  delta: z.number().int().refine((n) => n !== 0, "Cannot be zero"),
  type: z.enum(MOVEMENT_TYPES),
  reference: required(200),
});

const supplierFields = {
  name: required(120),
  contactPerson: text(80).default(""),
  phone: text(30).default(""),
  email: email.default(""),
  address: text(300).default(""),
  status: z.enum(["Active", "Inactive"]).default("Active"),
  outstandingBalance: money.default(0),
};
export const supplierCreateSchema = z.strictObject({ id: clientId, ...supplierFields });
export const supplierUpdateSchema = z.strictObject(supplierFields).partial();

export const purchaseCreateSchema = z
  .strictObject({
    id: clientId,
    supplierId: ref,
    invoiceNumber: text(30).optional(),
    purchaseDate: date,
    expectedDelivery: date,
    status: z.enum(["Draft", "Pending"]),
    paymentStatus: z.enum(PAYMENT_STATUSES),
    notes: text(300).default(""),
    items: z
      .array(z.strictObject({ medicineId: ref, quantity: z.number().int().min(1), unitPrice: money }))
      .min(1, "Add at least one medicine")
      .max(200),
  })
  .refine((v) => v.expectedDelivery >= v.purchaseDate, {
    path: ["expectedDelivery"],
    message: "Delivery cannot be before the purchase date",
  });

export const purchaseStatusSchema = z.strictObject({ status: z.enum(["Pending", "Cancelled"]) });

export const receivePurchaseSchema = z.strictObject({
  received: z.record(ref, count),
});

export const saleCreateSchema = z.strictObject({
  customerId: ref.nullable().default(null),
  items: z
    .array(z.strictObject({ medicineId: ref, quantity: z.number().int().min(1).max(10_000), discount: money.default(0) }))
    .min(1, "The cart is empty")
    .max(100),
  orderDiscount: z
    .strictObject({ type: z.enum(["percent", "fixed"]), value: money })
    .default({ type: "fixed", value: 0 }),
  paymentMethod: z.enum(PAYMENT_METHODS),
  amountReceived: money.optional(),
});

const customerFields = {
  name: required(120),
  phone: text(30).default(""),
  email: email.default(""),
  address: text(300).default(""),
  dateOfBirth: z.union([date, z.literal("")]).optional(),
};
export const customerCreateSchema = z.strictObject({ id: clientId, ...customerFields });
export const customerUpdateSchema = z.strictObject(customerFields).partial();
export const redeemSchema = z.strictObject({ points: z.number().int().min(1) });

export const prescriptionCreateSchema = z.strictObject({
  id: clientId,
  patientName: required(120),
  patientPhone: text(30).default(""),
  doctorName: required(120),
  doctorContact: text(60).default(""),
  date,
  medicines: z
    .array(z.strictObject({ medicineId: ref, quantity: z.number().int().min(1), dosageNote: text(200).default("") }))
    .min(1)
    .max(50),
  notes: text(300).default(""),
});
export const prescriptionStatusSchema = z.strictObject({
  status: z.enum(RX_STATUSES),
  notes: text(300).optional(),
});

const staffFields = {
  name: required(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  phone: text(30).default(""),
  role: z.enum(ROLES),
  status: z.enum(STAFF_STATUSES).default("Active"),
  joiningDate: date,
};
const password = z.string().min(8, "Password must be at least 8 characters").max(128);
export const staffCreateSchema = z.strictObject({ id: clientId, ...staffFields, password });
export const staffUpdateSchema = z.strictObject({ ...staffFields, password }).partial();

export const profileUpdateSchema = z
  .strictObject({
    pharmacyName: required(120),
    legalName: text(160),
    licenseNumber: text(60),
    ntn: text(20),
    phone: text(30),
    email,
    address: text(300),
    city: text(80),
    currency: text(10),
    timezone: text(60),
    taxRate: z.number().min(0).max(100),
    taxInclusive: z.boolean(),
    invoicePrefix: z.string().trim().regex(/^[A-Za-z]{2,6}$/, "2–6 letters"),
    invoiceFooter: text(160),
    receiptPaperWidth: z.enum(["58mm", "80mm"]),
    lowStockAlerts: z.boolean(),
    expiryAlerts: z.boolean(),
    dailySummaryEmail: z.boolean(),
    paymentsEnabled: z.strictObject(Object.fromEntries(PAYMENT_METHODS.map((m) => [m, z.boolean()]))).partial(),
  })
  .partial();
