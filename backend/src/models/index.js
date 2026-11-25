import mongoose from "mongoose";

const { Schema, model } = mongoose;

/*
 * Every document uses a readable string _id ("med-01", "MP-000123") instead of an ObjectId,
 * so the ids the frontend already uses keep working. JSON output renames _id to id,
 * which gives the exact shapes declared in the frontend's src/types/index.ts.
 */
const toJSON = {
  virtuals: false,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.passwordHash;
    return ret;
  },
};
const opts = { timestamps: true, toJSON };
const sub = { _id: false };

export const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Inhaler", "Sachet", "Lotion"];
export const MOVEMENT_TYPES = ["Stock In", "Stock Out", "Sale", "Adjustment", "Return"];
export const PURCHASE_STATUSES = ["Draft", "Pending", "Received", "Partially Received", "Cancelled"];
export const PAYMENT_STATUSES = ["Paid", "Partial", "Unpaid"];
export const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "JazzCash", "EasyPaisa"];
export const SALE_STATUSES = ["Paid", "Refunded", "Partially Refunded"];
export const RX_STATUSES = ["Pending", "Verified", "Dispensed", "Rejected"];
export const ROLES = ["Admin", "Pharmacist", "Cashier", "Inventory Manager"];
export const STAFF_STATUSES = ["Active", "On Leave", "Inactive"];
export const ACTIVITY_KINDS = ["sale", "stock", "purchase", "prescription", "system"];

const id = { type: String, required: true };
const str = { type: String, default: "" };
const money = { type: Number, required: true, min: 0 };

export const Category = model(
  "Category",
  new Schema({ _id: id, name: { type: String, required: true, trim: true }, description: str }, opts),
);

export const Medicine = model(
  "Medicine",
  new Schema(
    {
      _id: id,
      name: { type: String, required: true, trim: true },
      genericName: { type: String, required: true },
      brand: str,
      sku: { type: String, required: true, index: true },
      barcode: { type: String, default: "", index: true },
      categoryId: { type: String, required: true, index: true },
      dosageForm: { type: String, enum: DOSAGE_FORMS, required: true },
      strength: { type: String, required: true },
      manufacturer: str,
      batchNumber: str,
      purchasePrice: money,
      sellingPrice: money,
      stock: { type: Number, required: true, min: 0 },
      minStock: { type: Number, required: true, min: 0 },
      expiryDate: { type: String, required: true },
      prescriptionRequired: { type: Boolean, default: false },
      description: str,
      supplierId: str,
      image: String,
    },
    opts,
  ),
);

export const Supplier = model(
  "Supplier",
  new Schema(
    {
      _id: id,
      name: { type: String, required: true, trim: true },
      contactPerson: str,
      phone: str,
      email: str,
      address: str,
      status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
      outstandingBalance: { type: Number, default: 0, min: 0 },
    },
    opts,
  ),
);

export const Purchase = model(
  "Purchase",
  new Schema(
    {
      _id: id,
      supplierId: { type: String, required: true, index: true },
      invoiceNumber: { type: String, required: true },
      purchaseDate: { type: String, required: true },
      expectedDelivery: { type: String, required: true },
      status: { type: String, enum: PURCHASE_STATUSES, required: true },
      paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true },
      items: [
        new Schema(
          {
            medicineId: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            unitPrice: money,
            receivedQuantity: { type: Number, default: 0, min: 0 },
          },
          sub,
        ),
      ],
      total: money,
      notes: str,
    },
    opts,
  ),
);

export const Customer = model(
  "Customer",
  new Schema(
    {
      _id: id,
      name: { type: String, required: true, trim: true },
      phone: str,
      email: str,
      address: str,
      dateOfBirth: String,
      loyaltyPoints: { type: Number, default: 0, min: 0 },
      totalPurchases: { type: Number, default: 0, min: 0 },
      lastPurchase: { type: String, default: null },
    },
    opts,
  ),
);

export const Sale = model(
  "Sale",
  new Schema(
    {
      _id: id,
      date: { type: String, required: true, index: true },
      customerId: { type: String, default: null, index: true },
      customerName: { type: String, required: true },
      items: [
        new Schema(
          {
            medicineId: { type: String, required: true },
            name: { type: String, required: true },
            strength: str,
            quantity: { type: Number, required: true, min: 1 },
            unitPrice: money,
            discount: { type: Number, default: 0, min: 0 },
          },
          sub,
        ),
      ],
      subtotal: money,
      discount: { type: Number, default: 0, min: 0 },
      tax: money,
      total: money,
      paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
      amountReceived: money,
      change: { type: Number, default: 0, min: 0 },
      cashier: { type: String, required: true },
      paymentStatus: { type: String, enum: SALE_STATUSES, default: "Paid" },
    },
    opts,
  ),
);

export const Prescription = model(
  "Prescription",
  new Schema(
    {
      _id: id,
      patientName: { type: String, required: true },
      patientPhone: str,
      doctorName: { type: String, required: true },
      doctorContact: str,
      date: { type: String, required: true },
      medicines: [
        new Schema(
          {
            medicineId: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            dosageNote: str,
          },
          sub,
        ),
      ],
      status: { type: String, enum: RX_STATUSES, default: "Pending" },
      notes: str,
    },
    opts,
  ),
);

export const Staff = model(
  "Staff",
  new Schema(
    {
      _id: id,
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      phone: str,
      role: { type: String, enum: ROLES, required: true },
      status: { type: String, enum: STAFF_STATUSES, default: "Active" },
      joiningDate: { type: String, required: true },
      passwordHash: { type: String, select: false },
    },
    opts,
  ),
  "staff",
);

export const StockMovement = model(
  "StockMovement",
  new Schema(
    {
      _id: id,
      medicineId: { type: String, required: true, index: true },
      type: { type: String, enum: MOVEMENT_TYPES, required: true },
      quantity: { type: Number, required: true },
      reference: str,
      date: { type: String, required: true, index: true },
      user: { type: String, required: true },
    },
    opts,
  ),
);

export const Activity = model(
  "Activity",
  new Schema(
    {
      _id: id,
      message: { type: String, required: true },
      time: { type: String, required: true, index: true },
      kind: { type: String, enum: ACTIVITY_KINDS, required: true },
    },
    opts,
  ),
  "activity",
);

/** One document, _id "store": the pharmacy's settings. */
export const StoreProfile = model(
  "StoreProfile",
  new Schema(
    {
      _id: id,
      pharmacyName: { type: String, required: true },
      legalName: str,
      licenseNumber: str,
      ntn: str,
      phone: str,
      email: str,
      address: str,
      city: str,
      currency: { type: String, default: "PKR" },
      timezone: { type: String, default: "Asia/Karachi" },
      taxRate: { type: Number, required: true, min: 0, max: 100 },
      taxInclusive: { type: Boolean, default: false },
      invoicePrefix: { type: String, required: true },
      invoiceFooter: str,
      receiptPaperWidth: { type: String, enum: ["58mm", "80mm"], default: "80mm" },
      lowStockAlerts: { type: Boolean, default: true },
      expiryAlerts: { type: Boolean, default: true },
      dailySummaryEmail: { type: Boolean, default: false },
      paymentsEnabled: new Schema(Object.fromEntries(PAYMENT_METHODS.map((m) => [m, { type: Boolean, default: true }])), sub),
    },
    {
      ...opts,
      toJSON: { ...toJSON, transform: (d, r) => (toJSON.transform(d, r), delete r.id, r) },
    },
  ),
  "settings",
);

/** Sequence numbers for sale invoices and purchase orders. */
export const Counter = model("Counter", new Schema({ _id: String, seq: { type: Number, default: 0 } }));

export const ALL_MODELS = [
  Category, Medicine, Supplier, Purchase, Customer, Sale, Prescription, Staff, StockMovement, Activity, StoreProfile, Counter,
];
