import type {
  ActivityItem,
  Category,
  Customer,
  Medicine,
  Prescription,
  Purchase,
  Sale,
  StaffMember,
  StoreProfile,
  Supplier,
  PaymentMethod,
} from "@/types";

/*
 * Centralised demo data. Used only to seed the local store on first load.
 * Keep all sample records here so a real backend can replace this file later.
 */

export const categories: Category[] = [
  { id: "cat-analgesic", name: "Analgesics", description: "Pain and fever relief" },
  { id: "cat-antibiotic", name: "Antibiotics", description: "Bacterial infection treatment" },
  { id: "cat-antacid", name: "Gastro & Antacids", description: "Acidity and digestive care" },
  { id: "cat-respiratory", name: "Respiratory", description: "Cough, cold and asthma" },
  { id: "cat-vitamin", name: "Vitamins & Supplements", description: "Daily nutritional support" },
  { id: "cat-diabetes", name: "Diabetes Care", description: "Glucose management products" },
  { id: "cat-cardio", name: "Cardiovascular", description: "Blood pressure and heart care" },
  { id: "cat-personal", name: "Personal Care", description: "First aid and hygiene" },
];

export const suppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Hilltop Pharma Distributors",
    contactPerson: "Imran Qureshi",
    phone: "+92 21 3512 4480",
    email: "orders@hilltoppharma.pk",
    address: "Plot 14, Sector 7, Korangi Industrial Area, Karachi",
    status: "Active",
    outstandingBalance: 185400,
  },
  {
    id: "sup-2",
    name: "Lahore Medicare Traders",
    contactPerson: "Zubair Ahmed",
    phone: "+92 42 3578 2210",
    email: "sales@lahoremedicare.pk",
    address: "Shop 22, Ferozepur Road, Lahore",
    status: "Active",
    outstandingBalance: 62300,
  },
  {
    id: "sup-3",
    name: "Crescent Wholesale Pharma",
    contactPerson: "Hina Tariq",
    phone: "+92 51 2274 9031",
    email: "info@crescentwholesale.pk",
    address: "Office 5, Blue Area, Islamabad",
    status: "Active",
    outstandingBalance: 0,
  },
  {
    id: "sup-4",
    name: "Frontier Health Supplies",
    contactPerson: "Asif Khattak",
    phone: "+92 91 5840 1177",
    email: "care@frontierhealth.pk",
    address: "Saddar Road, Peshawar Cantt",
    status: "Inactive",
    outstandingBalance: 12500,
  },
];

export const medicines: Medicine[] = [
  med("med-01", "Panadol Extra", "Paracetamol + Caffeine", "GSK", "PHM-1001", "6221000101", "cat-analgesic", "Tablet", "500mg", "GlaxoSmithKline Pakistan", "PX-24B11", 42, 58, 240, 50, "2027-03-31", false, "sup-1"),
  med("med-02", "Brufen", "Ibuprofen", "Abbott", "PHM-1002", "6221000102", "cat-analgesic", "Tablet", "400mg", "Abbott Laboratories", "BR-24C03", 36, 50, 18, 40, "2027-01-15", false, "sup-1"),
  med("med-03", "Amoxil", "Amoxicillin", "GSK", "PHM-1003", "6221000103", "cat-antibiotic", "Capsule", "500mg", "GlaxoSmithKline Pakistan", "AM-25A07", 110, 145, 96, 30, "2026-12-20", true, "sup-2"),
  med("med-04", "Augmentin", "Amoxicillin + Clavulanate", "GSK", "PHM-1004", "6221000104", "cat-antibiotic", "Tablet", "625mg", "GlaxoSmithKline Pakistan", "AG-25D02", 190, 245, 40, 20, "2026-12-05", true, "sup-2"),
  med("med-05", "Ciprobid", "Ciprofloxacin", "Bayer", "PHM-1005", "6221000105", "cat-antibiotic", "Tablet", "500mg", "Bayer Pakistan", "CB-26A15", 58, 80, 0, 25, "2027-05-31", true, "sup-1"),
  med("med-06", "Azomax", "Azithromycin", "Abbott", "PHM-1006", "6221000106", "cat-antibiotic", "Tablet", "500mg", "Abbott Laboratories", "AZ-25B19", 150, 195, 64, 20, "2026-11-30", true, "sup-3"),
  med("med-07", "Nexium", "Esomeprazole", "AstraZeneca", "PHM-1007", "6221000107", "cat-antacid", "Capsule", "40mg", "AstraZeneca Pakistan", "NX-25E08", 210, 265, 72, 20, "2027-02-28", false, "sup-2"),
  med("med-08", "Gaviscon", "Sodium Alginate + Antacid", "Reckitt", "PHM-1008", "6221000108", "cat-antacid", "Sachet", "10ml", "Reckitt Benckiser", "GV-25F04", 55, 75, 110, 30, "2027-08-31", false, "sup-3"),
  med("med-09", "Telfast", "Fexofenadine", "Sanofi", "PHM-1009", "6221000109", "cat-respiratory", "Tablet", "120mg", "Sanofi Pakistan", "TF-25G12", 78, 100, 52, 20, "2027-04-30", false, "sup-1"),
  med("med-10", "Ventolin Inhaler", "Salbutamol", "GSK", "PHM-1010", "6221000110", "cat-respiratory", "Inhaler", "100mcg", "GlaxoSmithKline Pakistan", "VT-25H01", 520, 640, 14, 10, "2027-06-30", false, "sup-2"),
  med("med-11", "Benadryl Syrup", "Diphenhydramine", "Pfizer", "PHM-1011", "6221000111", "cat-respiratory", "Syrup", "60ml", "Pfizer Pakistan", "BS-25J05", 135, 170, 30, 12, "2026-12-15", false, "sup-3"),
  med("med-12", "Surbex Z", "Vitamin B-Complex + Zinc", "Abbott", "PHM-1012", "6221000112", "cat-vitamin", "Capsule", "Multi", "Abbott Laboratories", "SZ-25K09", 38, 55, 180, 40, "2028-01-31", false, "sup-1"),
  med("med-13", "Caltrate D", "Calcium + Vitamin D3", "Wyeth", "PHM-1013", "6221000113", "cat-vitamin", "Tablet", "600mg", "Wyeth Pakistan", "CT-25L14", 62, 85, 66, 25, "2027-09-30", false, "sup-2"),
  med("med-14", "Glucophage", "Metformin", "Merck", "PHM-1014", "6221000114", "cat-diabetes", "Tablet", "850mg", "Merck Pakistan", "GF-25M02", 24, 34, 220, 60, "2027-07-31", true, "sup-1"),
  med("med-15", "Diamicron MR", "Gliclazide MR", "Servier", "PHM-1015", "6221000115", "cat-diabetes", "Tablet", "60mg", "Servier Pakistan", "DM-25N11", 48, 65, 75, 30, "2027-02-28", true, "sup-3"),
  med("med-16", "Lantus SoloStar", "Insulin Glargine", "Sanofi", "PHM-1016", "6221000116", "cat-diabetes", "Injection", "100IU/ml", "Sanofi Pakistan", "LS-25P03", 1450, 1690, 8, 6, "2027-01-31", true, "sup-3"),
  med("med-17", "Concor", "Bisoprolol", "Merck", "PHM-1017", "6221000117", "cat-cardio", "Tablet", "5mg", "Merck Pakistan", "CN-25Q06", 32, 45, 140, 40, "2027-10-31", true, "sup-1"),
  med("med-18", "Norvasc", "Amlodipine", "Pfizer", "PHM-1018", "6221000118", "cat-cardio", "Tablet", "5mg", "Pfizer Pakistan", "NV-25R08", 28, 40, 190, 50, "2027-06-30", true, "sup-2"),
  med("med-19", "Plavix", "Clopidogrel", "Sanofi", "PHM-1019", "6221000119", "cat-cardio", "Tablet", "75mg", "Sanofi Pakistan", "PL-24S01", 70, 95, 44, 20, "2026-10-31", true, "sup-3"),
  med("med-20", "Betadine Solution", "Povidone-Iodine", "Mundipharma", "PHM-1020", "6221000120", "cat-personal", "Ointment", "10%", "Mundipharma", "BT-25T10", 95, 120, 26, 15, "2028-03-31", false, "sup-2"),
  med("med-21", "Lacto Calamine", "Calamine + Zinc Oxide", "Glaxo", "PHM-1021", "6221000121", "cat-personal", "Lotion", "120ml", "GlaxoSmithKline Pakistan", "LC-25U04", 210, 260, 19, 10, "2027-11-30", false, "sup-1"),
  med("med-22", "Otrivin Nasal", "Xylometazoline", "Novartis", "PHM-1022", "6221000122", "cat-respiratory", "Drops", "0.1%", "Novartis Pharma", "OT-25V07", 88, 115, 34, 15, "2026-11-10", false, "sup-3"),
  med("med-23", "Flagyl", "Metronidazole", "Pfizer", "PHM-1023", "6221000123", "cat-antibiotic", "Tablet", "400mg", "Pfizer Pakistan", "FG-25W11", 18, 28, 300, 60, "2027-12-31", true, "sup-2"),
  med("med-24", "Panadol Syrup", "Paracetamol", "GSK", "PHM-1024", "6221000124", "cat-analgesic", "Syrup", "125mg/5ml", "GlaxoSmithKline Pakistan", "PS-25X02", 85, 110, 9, 12, "2026-12-31", false, "sup-1"),
];

function med(
  id: string,
  name: string,
  genericName: string,
  brand: string,
  sku: string,
  barcode: string,
  categoryId: string,
  dosageForm: Medicine["dosageForm"],
  strength: string,
  manufacturer: string,
  batchNumber: string,
  purchasePrice: number,
  sellingPrice: number,
  stock: number,
  minStock: number,
  expiryDate: string,
  prescriptionRequired: boolean,
  supplierId: string,
): Medicine {
  return {
    id,
    name,
    genericName,
    brand,
    sku,
    barcode,
    categoryId,
    dosageForm,
    strength,
    manufacturer,
    batchNumber,
    purchasePrice,
    sellingPrice,
    stock,
    minStock,
    expiryDate,
    prescriptionRequired,
    description: `${name} (${genericName}) ${strength} ${dosageForm.toLowerCase()}. Store below 25°C, keep away from children.`,
    supplierId,
  };
}

export const customers: Customer[] = [
  { id: "cus-01", name: "Ayesha Siddiqui", phone: "0300-1234567", email: "ayesha.s@gmail.com", address: "House 12, Block 4, Gulshan-e-Iqbal, Karachi", dateOfBirth: "1988-04-12", loyaltyPoints: 420, totalPurchases: 58340, lastPurchase: "2026-11-24T18:10:00" },
  { id: "cus-02", name: "Muhammad Bilal", phone: "0321-7654321", email: "bilal.khan@outlook.com", address: "Street 9, F-10 Markaz, Islamabad", dateOfBirth: "1975-09-03", loyaltyPoints: 1180, totalPurchases: 142900, lastPurchase: "2026-11-25T11:42:00" },
  { id: "cus-03", name: "Fatima Noor", phone: "0333-9876543", email: "fatima.noor@yahoo.com", address: "Model Town, Lahore", loyaltyPoints: 95, totalPurchases: 12450, lastPurchase: "2026-11-18T09:20:00" },
  { id: "cus-04", name: "Hamza Qadir", phone: "0312-4455667", email: "hamza.q@gmail.com", address: "Hayatabad Phase 3, Peshawar", dateOfBirth: "1992-01-27", loyaltyPoints: 310, totalPurchases: 33120, lastPurchase: "2026-11-21T16:05:00" },
  { id: "cus-05", name: "Sana Malik", phone: "0345-2233445", email: "sana.malik@gmail.com", address: "DHA Phase 6, Lahore", dateOfBirth: "1981-06-19", loyaltyPoints: 770, totalPurchases: 89600, lastPurchase: "2026-11-23T13:30:00" },
  { id: "cus-06", name: "Omar Farooq", phone: "0300-8899001", email: "omar.f@gmail.com", address: "Johar Town, Lahore", loyaltyPoints: 40, totalPurchases: 6780, lastPurchase: "2026-10-30T10:00:00" },
  { id: "cus-07", name: "Zainab Hassan", phone: "0321-5566778", email: "zainab.h@hotmail.com", address: "Clifton Block 5, Karachi", dateOfBirth: "1995-11-08", loyaltyPoints: 225, totalPurchases: 24300, lastPurchase: "2026-11-22T19:45:00" },
  { id: "cus-08", name: "Ali Raza", phone: "0313-1020304", email: "ali.raza@gmail.com", address: "Satellite Town, Rawalpindi", loyaltyPoints: 610, totalPurchases: 71250, lastPurchase: "2026-11-20T12:15:00" },
  { id: "cus-09", name: "Mehwish Tariq", phone: "0345-7070808", email: "mehwish.t@gmail.com", address: "Bahria Town, Islamabad", dateOfBirth: "1990-02-14", loyaltyPoints: 180, totalPurchases: 18900, lastPurchase: "2026-11-15T15:00:00" },
  { id: "cus-10", name: "Usman Ghani", phone: "0300-6060606", email: "usman.g@gmail.com", address: "Gulberg III, Lahore", loyaltyPoints: 0, totalPurchases: 1450, lastPurchase: null },
];

export const purchases: Purchase[] = [
  { id: "pur-1001", supplierId: "sup-1", invoiceNumber: "HTP-88412", purchaseDate: "2026-11-02", expectedDelivery: "2026-11-05", status: "Received", paymentStatus: "Paid", items: [{ medicineId: "med-01", quantity: 300, unitPrice: 42, receivedQuantity: 300 }, { medicineId: "med-14", quantity: 300, unitPrice: 24, receivedQuantity: 300 }], total: 19800, notes: "" },
  { id: "pur-1002", supplierId: "sup-2", invoiceNumber: "LMT-20391", purchaseDate: "2026-11-10", expectedDelivery: "2026-11-12", status: "Partially Received", paymentStatus: "Partial", items: [{ medicineId: "med-03", quantity: 120, unitPrice: 110, receivedQuantity: 96 }, { medicineId: "med-04", quantity: 60, unitPrice: 190, receivedQuantity: 40 }], total: 24600, notes: "Short-supplied balance, follow up with rep." },
  { id: "pur-1003", supplierId: "sup-3", invoiceNumber: "CWP-55107", purchaseDate: "2026-11-18", expectedDelivery: "2026-11-22", status: "Pending", paymentStatus: "Unpaid", items: [{ medicineId: "med-16", quantity: 10, unitPrice: 1450, receivedQuantity: 0 }, { medicineId: "med-18", quantity: 200, unitPrice: 28, receivedQuantity: 0 }], total: 20100, notes: "" },
  { id: "pur-1004", supplierId: "sup-1", invoiceNumber: "HTP-88590", purchaseDate: "2026-11-24", expectedDelivery: "2026-11-28", status: "Draft", paymentStatus: "Unpaid", items: [{ medicineId: "med-06", quantity: 100, unitPrice: 150, receivedQuantity: 0 }], total: 15000, notes: "" },
  { id: "pur-1005", supplierId: "sup-2", invoiceNumber: "LMT-20422", purchaseDate: "2026-10-28", expectedDelivery: "2026-11-01", status: "Cancelled", paymentStatus: "Unpaid", items: [{ medicineId: "med-10", quantity: 20, unitPrice: 520, receivedQuantity: 0 }], total: 10400, notes: "Supplier out of stock." },
  { id: "pur-1006", supplierId: "sup-3", invoiceNumber: "CWP-55022", purchaseDate: "2026-10-15", expectedDelivery: "2026-10-18", status: "Received", paymentStatus: "Paid", items: [{ medicineId: "med-08", quantity: 150, unitPrice: 55, receivedQuantity: 150 }, { medicineId: "med-23", quantity: 300, unitPrice: 18, receivedQuantity: 300 }], total: 13650, notes: "" },
];

export const prescriptions: Prescription[] = [
  { id: "RX-2611-001", patientName: "Ayesha Siddiqui", patientPhone: "0300-1234567", doctorName: "Dr. Saima Rehman", doctorContact: "0300-5550101", date: "2026-11-25", medicines: [{ medicineId: "med-03", quantity: 21, dosageNote: "1 capsule twice daily for 7 days" }], status: "Pending", notes: "" },
  { id: "RX-2611-002", patientName: "Muhammad Bilal", patientPhone: "0321-7654321", doctorName: "Dr. Kamran Yousaf", doctorContact: "0321-5550202", date: "2026-11-24", medicines: [{ medicineId: "med-14", quantity: 60, dosageNote: "As prescribed by doctor" }, { medicineId: "med-17", quantity: 30, dosageNote: "Once daily" }], status: "Verified", notes: "Verified against prescriber record." },
  { id: "RX-2611-003", patientName: "Hamza Qadir", patientPhone: "0312-4455667", doctorName: "Dr. Naveed Akbar", doctorContact: "0312-5550303", date: "2026-11-24", medicines: [{ medicineId: "med-06", quantity: 6, dosageNote: "500mg once daily for 3 days" }], status: "Dispensed", notes: "" },
  { id: "RX-2611-004", patientName: "Sana Malik", patientPhone: "0345-2233445", doctorName: "Dr. Farah Ijaz", doctorContact: "0345-5550404", date: "2026-11-23", medicines: [{ medicineId: "med-18", quantity: 30, dosageNote: "Once daily" }], status: "Dispensed", notes: "" },
  { id: "RX-2611-005", patientName: "Omar Farooq", patientPhone: "0300-8899001", doctorName: "Dr. Waqar Hussain", doctorContact: "0300-5550505", date: "2026-11-22", medicines: [{ medicineId: "med-05", quantity: 10, dosageNote: "Dose to be confirmed by prescriber" }], status: "Rejected", notes: "Prescription illegible in dosage field. Prescriber asked to resubmit." },
  { id: "RX-2611-006", patientName: "Zainab Hassan", patientPhone: "0321-5566778", doctorName: "Dr. Saima Rehman", doctorContact: "0300-5550101", date: "2026-11-25", medicines: [{ medicineId: "med-15", quantity: 30, dosageNote: "Once daily before breakfast" }, { medicineId: "med-14", quantity: 60, dosageNote: "Twice daily with meals" }], status: "Pending", notes: "" },
  { id: "RX-2611-007", patientName: "Ali Raza", patientPhone: "0313-1020304", doctorName: "Dr. Kamran Yousaf", doctorContact: "0321-5550202", date: "2026-11-20", medicines: [{ medicineId: "med-09", quantity: 10, dosageNote: "Once daily" }], status: "Dispensed", notes: "" },
];

export const staff: StaffMember[] = [
  { id: "stf-01", name: "Shahid Mehmood", email: "shahid@medipos.pk", phone: "0300-1112233", role: "Admin", status: "Active", joiningDate: "2021-03-01" },
  { id: "stf-02", name: "Dr. Rabia Anwar", email: "rabia.anwar@medipos.pk", phone: "0321-2223344", role: "Pharmacist", status: "Active", joiningDate: "2022-07-15" },
  { id: "stf-03", name: "Kashif Ali", email: "kashif.ali@medipos.pk", phone: "0333-3334455", role: "Cashier", status: "Active", joiningDate: "2023-01-10" },
  { id: "stf-04", name: "Bushra Jabeen", email: "bushra.j@medipos.pk", phone: "0312-4445566", role: "Cashier", status: "On Leave", joiningDate: "2023-09-01" },
  { id: "stf-05", name: "Tariq Mahmood", email: "tariq.m@medipos.pk", phone: "0345-5556677", role: "Inventory Manager", status: "Active", joiningDate: "2022-02-20" },
  { id: "stf-06", name: "Noor-ul-Ain", email: "noor.ua@medipos.pk", phone: "0300-6667788", role: "Pharmacist", status: "Inactive", joiningDate: "2020-11-05" },
];

export const activity: ActivityItem[] = [
  { id: "act-1", message: "Sale MP-000142 completed for Muhammad Bilal", time: "2026-11-25T11:42:00", kind: "sale" },
  { id: "act-2", message: "Prescription RX-2611-002 verified by Dr. Rabia Anwar", time: "2026-11-25T10:15:00", kind: "prescription" },
  { id: "act-3", message: "Stock received for PO HTP-88412 (Panadol Extra, Glucophage)", time: "2026-11-24T16:00:00", kind: "purchase" },
  { id: "act-4", message: "Low stock alert: Ventolin Inhaler (14 left)", time: "2026-11-24T09:30:00", kind: "stock" },
  { id: "act-5", message: "Batch PX-24B11 near expiry: 2 months remaining", time: "2026-11-23T08:00:00", kind: "system" },
  { id: "act-6", message: "Stock adjusted: Otrivin Nasal −2 (damaged bottle)", time: "2026-11-22T14:20:00", kind: "stock" },
];

/**
 * Demo baseline for the "previous period" side of inventory KPI trends.
 * Live stock records have no history yet, so these values stand in for last month.
 */
export const previousPeriodBaseline = {
  products: 21,
  lowStock: 5,
  expiringSoon: 7,
};

export const storeProfile: StoreProfile = {
  pharmacyName: "MediPOS Pharmacy",
  legalName: "MediPOS Pharmacy (Pvt) Ltd",
  licenseNumber: "DRAP-SD-2219-PH",
  ntn: "1234567-8",
  phone: "+92 21 3456 7890",
  email: "counter@medipos.pk",
  address: "Shop 3, Tariq Road, Block 2, PECHS",
  city: "Karachi",
  currency: "PKR",
  timezone: "Asia/Karachi",
  taxRate: 17,
  taxInclusive: false,
  invoicePrefix: "MP",
  invoiceFooter: "Medicines once sold are not returnable. Thank you for trusting MediPOS.",
  receiptPaperWidth: "80mm",
  lowStockAlerts: true,
  expiryAlerts: true,
  dailySummaryEmail: false,
  paymentsEnabled: { Cash: true, Card: true, "Bank Transfer": true, JazzCash: true, EasyPaisa: true } as Record<PaymentMethod, boolean>,
};

/** Deterministic PRNG so generated sales are identical across reloads. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Builds ~180 days of realistic counter sales for analytics and history. */
export function generateSales(): Sale[] {
  const rand = rng(20261125);
  const methods: PaymentMethod[] = ["Cash", "Cash", "Card", "JazzCash", "EasyPaisa", "Bank Transfer"];
  const cashiers = ["Kashif Ali", "Bushra Jabeen", "Shahid Mehmood"];
  const sales: Sale[] = [];
  const today = new Date("2026-11-25T20:00:00");
  let n = 0;
  for (let day = 179; day >= 0; day--) {
    const d = new Date(today);
    d.setDate(today.getDate() - day);
    const perDay = 6 + Math.floor(rand() * 9) + (d.getDay() === 5 ? 3 : 0);
    for (let k = 0; k < perDay; k++) {
      n++;
      const lineCount = 1 + Math.floor(rand() * 3);
      const items = [] as Sale["items"];
      const used = new Set<string>();
      for (let l = 0; l < lineCount; l++) {
        const m = medicines[Math.floor(rand() * medicines.length)];
        if (used.has(m.id)) continue;
        used.add(m.id);
        items.push({
          medicineId: m.id,
          name: m.name,
          strength: m.strength,
          quantity: 1 + Math.floor(rand() * 3),
          unitPrice: m.sellingPrice,
          discount: 0,
        });
      }
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const tax = Math.round(subtotal * 0.17);
      const total = subtotal + tax;
      const hasCustomer = rand() > 0.35;
      const customer = hasCustomer ? customers[Math.floor(rand() * customers.length)] : null;
      const method = methods[Math.floor(rand() * methods.length)];
      const received = method === "Cash" ? Math.ceil(total / 100) * 100 : total;
      const date = new Date(d);
      date.setHours(9 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);
      sales.push({
        id: `MP-${String(n).padStart(6, "0")}`,
        date: date.toISOString(),
        customerId: customer?.id ?? null,
        customerName: customer?.name ?? "Walk-in Customer",
        items,
        subtotal,
        discount: 0,
        tax,
        total,
        paymentMethod: method,
        amountReceived: received,
        change: received - total,
        cashier: cashiers[Math.floor(rand() * cashiers.length)],
        paymentStatus: "Paid",
      });
    }
  }
  return sales.reverse();
}
