export type DosageForm =
  | "Tablet"
  | "Capsule"
  | "Syrup"
  | "Injection"
  | "Ointment"
  | "Drops"
  | "Inhaler"
  | "Sachet"
  | "Lotion";

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  sku: string;
  barcode: string;
  categoryId: string;
  dosageForm: DosageForm;
  strength: string;
  manufacturer: string;
  batchNumber: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  expiryDate: string; // ISO yyyy-mm-dd
  prescriptionRequired: boolean;
  description: string;
  supplierId: string;
  image?: string;
}

export type BatchStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Near Expiry" | "Expired";

export interface Batch {
  id: string;
  medicineId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  supplierId: string;
  purchasePrice: number;
}

export type StockMovementType = "Stock In" | "Stock Out" | "Sale" | "Adjustment" | "Return";

export interface StockMovement {
  id: string;
  medicineId: string;
  type: StockMovementType;
  quantity: number; // signed: positive adds stock, negative removes
  reference: string;
  date: string; // ISO datetime
  user: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: "Active" | "Inactive";
  outstandingBalance: number;
}

export type PurchaseStatus = "Draft" | "Pending" | "Received" | "Partially Received" | "Cancelled";
export type PaymentStatus = "Paid" | "Partial" | "Unpaid";

export interface PurchaseItem {
  medicineId: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  purchaseDate: string;
  expectedDelivery: string;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  items: PurchaseItem[];
  total: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  lastPurchase: string | null;
}

export type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "JazzCash" | "EasyPaisa";

export interface SaleItem {
  medicineId: string;
  name: string;
  strength: string;
  quantity: number;
  unitPrice: number;
  discount: number; // fixed discount on this line
}

export type SalePaymentStatus = "Paid" | "Refunded" | "Partially Refunded";

export interface Sale {
  id: string;
  date: string; // ISO datetime
  customerId: string | null;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  change: number;
  cashier: string;
  paymentStatus: SalePaymentStatus;
}

export type PrescriptionStatus = "Pending" | "Verified" | "Dispensed" | "Rejected";

export interface Prescription {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorContact: string;
  date: string;
  medicines: { medicineId: string; quantity: number; dosageNote: string }[];
  status: PrescriptionStatus;
  notes: string;
}

export type StaffRole = "Admin" | "Pharmacist" | "Cashier" | "Inventory Manager";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: "Active" | "On Leave" | "Inactive";
  joiningDate: string;
}

export interface ActivityItem {
  id: string;
  message: string;
  time: string;
  kind: "sale" | "stock" | "purchase" | "prescription" | "system";
}

export interface CartLine {
  medicineId: string;
  quantity: number;
  discount: number; // fixed PKR discount on this line
}

export interface HeldOrder {
  id: string;
  label: string;
  heldAt: string;
  customerId: string | null;
  cart: CartLine[];
  orderDiscount: { type: "percent" | "fixed"; value: number };
}

export interface StoreProfile {
  pharmacyName: string;
  legalName: string;
  licenseNumber: string;
  ntn: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  currency: string;
  timezone: string;
  taxRate: number;
  taxInclusive: boolean;
  invoicePrefix: string;
  invoiceFooter: string;
  receiptPaperWidth: "58mm" | "80mm";
  lowStockAlerts: boolean;
  expiryAlerts: boolean;
  dailySummaryEmail: boolean;
  paymentsEnabled: Record<PaymentMethod, boolean>;
}
