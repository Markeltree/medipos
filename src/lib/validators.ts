import { z } from "zod";
import { parseISO, startOfDay } from "date-fns";

/* Zod schemas for every form. Numeric fields use valueAsNumber in the UI. */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
const pkPhone = z
  .string()
  .trim()
  .regex(/^(\+92|0)3\d{2}-?\d{7}$/, "Enter a valid Pakistani mobile, e.g. 0300-1234567");

export const dosageForms = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Inhaler", "Sachet", "Lotion"] as const;

export const medicineSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the medicine name"),
    genericName: z.string().trim().min(2, "Enter the generic name"),
    brand: z.string().trim().max(60, "Keep it under 60 characters"),
    sku: z.string().trim().regex(/^[A-Za-z0-9-]{3,20}$/, "3–20 letters, numbers or dashes"),
    barcode: z.string().trim().regex(/^\d{8,14}$/, "Barcode must be 8–14 digits"),
    categoryId: z.string().min(1, "Choose a category"),
    dosageForm: z.enum(dosageForms, { message: "Choose a dosage form" }),
    strength: z.string().trim().min(1, "Enter the strength, e.g. 500mg"),
    manufacturer: z.string().trim().min(2, "Enter the manufacturer"),
    batchNumber: z.string().trim().min(3, "Enter the batch number"),
    purchasePrice: z.number({ message: "Enter a number" }).min(0, "Cannot be negative"),
    sellingPrice: z.number({ message: "Enter a number" }).min(0, "Cannot be negative"),
    stock: z.number({ message: "Enter a whole number" }).int("Whole numbers only").min(0, "Cannot be negative"),
    minStock: z.number({ message: "Enter a whole number" }).int("Whole numbers only").min(0, "Cannot be negative"),
    expiryDate: isoDate,
    prescriptionRequired: z.boolean(),
    description: z.string().max(300, "Keep it under 300 characters"),
    supplierId: z.string().min(1, "Choose a supplier"),
  })
  .superRefine((v, ctx) => {
    if (v.sellingPrice < v.purchasePrice) {
      ctx.addIssue({ code: "custom", path: ["sellingPrice"], message: "Selling price should not be below cost" });
    }
    const exp = parseISO(v.expiryDate);
    if (!Number.isNaN(exp.getTime()) && exp < startOfDay(new Date())) {
      ctx.addIssue({ code: "custom", path: ["expiryDate"], message: "New batches cannot already be expired" });
    }
  });
export type MedicineInput = z.infer<typeof medicineSchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name"),
  phone: pkPhone,
  email: z.string().trim().refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email"),
  address: z.string().trim().min(5, "Enter an address"),
  dateOfBirth: z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date"),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const supplierSchema = z.object({
  name: z.string().trim().min(3, "Enter the supplier name"),
  contactPerson: z.string().trim().min(2, "Enter a contact person"),
  phone: z.string().trim().regex(/^\+?[0-9 -]{7,20}$/, "Enter a valid phone number"),
  email: z.email("Enter a valid email"),
  address: z.string().trim().min(5, "Enter an address"),
  status: z.enum(["Active", "Inactive"]),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Enter the employee name"),
  email: z.email("Enter a valid email"),
  phone: pkPhone,
  role: z.enum(["Admin", "Pharmacist", "Cashier", "Inventory Manager"]),
  status: z.enum(["Active", "On Leave", "Inactive"]),
  joiningDate: isoDate,
});
export type StaffInput = z.infer<typeof staffSchema>;

/** Staff form: password is required when creating (checked on submit) and optional when editing. */
export const staffFormSchema = staffSchema.extend({
  password: z.string().refine((v) => v === "" || (v.length >= 8 && v.length <= 128), "Use 8 to 128 characters"),
});
export type StaffFormInput = z.infer<typeof staffFormSchema>;

export const purchaseSchema = z
  .object({
    supplierId: z.string().min(1, "Choose a supplier"),
    invoiceNumber: z.string().trim().max(30, "Keep it under 30 characters").optional(),
    purchaseDate: isoDate,
    expectedDelivery: isoDate,
    paymentStatus: z.enum(["Paid", "Partial", "Unpaid"]),
    status: z.enum(["Draft", "Pending"]),
    notes: z.string().max(300, "Keep it under 300 characters"),
    items: z
      .array(
        z.object({
          medicineId: z.string().min(1, "Choose a medicine"),
          quantity: z.number({ message: "Enter a quantity" }).int("Whole numbers only").min(1, "At least 1"),
          unitPrice: z.number({ message: "Enter a price" }).min(0, "Cannot be negative"),
        }),
      )
      .min(1, "Add at least one medicine"),
  })
  .superRefine((v, ctx) => {
    if (v.expectedDelivery < v.purchaseDate) {
      ctx.addIssue({ code: "custom", path: ["expectedDelivery"], message: "Delivery cannot be before the purchase date" });
    }
  });
export type PurchaseInput = z.infer<typeof purchaseSchema>;

export const adjustmentSchema = z.object({
  type: z.enum(["Stock In", "Stock Out", "Adjustment"]),
  quantity: z.number({ message: "Enter a quantity" }).int("Whole numbers only").refine((n) => n !== 0, "Cannot be zero"),
  reason: z.string().trim().min(3, "Give a short reason for the audit trail"),
});
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;

export const profileSchema = z.object({
  pharmacyName: z.string().trim().min(3, "Enter the trading name"),
  legalName: z.string().trim().min(3, "Enter the legal name"),
  licenseNumber: z.string().trim().min(4, "Enter the licence number"),
  ntn: z.string().trim().regex(/^\d{7}-\d$/, "Format: 1234567-8"),
  phone: z.string().trim().min(7, "Enter a phone number"),
  email: z.email("Enter a valid email"),
  address: z.string().trim().min(5, "Enter an address"),
  city: z.string().trim().min(2, "Enter a city"),
  taxRate: z.number({ message: "Enter a rate" }).min(0, "Cannot be negative").max(100, "Maximum 100"),
  invoicePrefix: z.string().trim().regex(/^[A-Za-z]{2,6}$/, "2–6 letters"),
  invoiceFooter: z.string().trim().max(160, "Keep it under 160 characters"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name"),
  description: z.string().trim().max(120, "Keep it under 120 characters"),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const prescriptionNotesSchema = z.object({
  notes: z.string().trim().max(300, "Keep it under 300 characters"),
});

/** Built per sale because cash must cover the total. */
export function paymentSchema(total: number) {
  return z
    .object({
      method: z.enum(["Cash", "Card", "Bank Transfer", "JazzCash", "EasyPaisa"]),
      amountReceived: z.number({ message: "Enter the amount received" }).min(0, "Cannot be negative"),
    })
    .superRefine((v, ctx) => {
      if (v.method === "Cash" && v.amountReceived < total) {
        ctx.addIssue({
          code: "custom",
          path: ["amountReceived"],
          message: "Amount received is less than the total payable",
        });
      }
    });
}
