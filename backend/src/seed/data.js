/* Demo data, ported from the frontend seed (src/data/seed.ts). */

export const categories = [
  {
    "id": "cat-analgesic",
    "name": "Analgesics",
    "description": "Pain and fever relief"
  },
  {
    "id": "cat-antibiotic",
    "name": "Antibiotics",
    "description": "Bacterial infection treatment"
  },
  {
    "id": "cat-antacid",
    "name": "Gastro & Antacids",
    "description": "Acidity and digestive care"
  },
  {
    "id": "cat-respiratory",
    "name": "Respiratory",
    "description": "Cough, cold and asthma"
  },
  {
    "id": "cat-vitamin",
    "name": "Vitamins & Supplements",
    "description": "Daily nutritional support"
  },
  {
    "id": "cat-diabetes",
    "name": "Diabetes Care",
    "description": "Glucose management products"
  },
  {
    "id": "cat-cardio",
    "name": "Cardiovascular",
    "description": "Blood pressure and heart care"
  },
  {
    "id": "cat-personal",
    "name": "Personal Care",
    "description": "First aid and hygiene"
  }
];

export const suppliers = [
  {
    "id": "sup-1",
    "name": "Hilltop Pharma Distributors",
    "contactPerson": "Imran Qureshi",
    "phone": "+92 21 3512 4480",
    "email": "orders@hilltoppharma.pk",
    "address": "Plot 14, Sector 7, Korangi Industrial Area, Karachi",
    "status": "Active",
    "outstandingBalance": 185400
  },
  {
    "id": "sup-2",
    "name": "Lahore Medicare Traders",
    "contactPerson": "Zubair Ahmed",
    "phone": "+92 42 3578 2210",
    "email": "sales@lahoremedicare.pk",
    "address": "Shop 22, Ferozepur Road, Lahore",
    "status": "Active",
    "outstandingBalance": 62300
  },
  {
    "id": "sup-3",
    "name": "Crescent Wholesale Pharma",
    "contactPerson": "Hina Tariq",
    "phone": "+92 51 2274 9031",
    "email": "info@crescentwholesale.pk",
    "address": "Office 5, Blue Area, Islamabad",
    "status": "Active",
    "outstandingBalance": 0
  },
  {
    "id": "sup-4",
    "name": "Frontier Health Supplies",
    "contactPerson": "Asif Khattak",
    "phone": "+92 91 5840 1177",
    "email": "care@frontierhealth.pk",
    "address": "Saddar Road, Peshawar Cantt",
    "status": "Inactive",
    "outstandingBalance": 12500
  }
];

export const medicines = [
  {
    "id": "med-01",
    "name": "Panadol Extra",
    "genericName": "Paracetamol + Caffeine",
    "brand": "GSK",
    "sku": "PHM-1001",
    "barcode": "6221000101",
    "categoryId": "cat-analgesic",
    "dosageForm": "Tablet",
    "strength": "500mg",
    "manufacturer": "GlaxoSmithKline Pakistan",
    "batchNumber": "PX-24B11",
    "purchasePrice": 42,
    "sellingPrice": 58,
    "stock": 240,
    "minStock": 50,
    "expiryDate": "2027-03-31",
    "prescriptionRequired": false,
    "description": "Panadol Extra (Paracetamol + Caffeine) 500mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  },
  {
    "id": "med-02",
    "name": "Brufen",
    "genericName": "Ibuprofen",
    "brand": "Abbott",
    "sku": "PHM-1002",
    "barcode": "6221000102",
    "categoryId": "cat-analgesic",
    "dosageForm": "Tablet",
    "strength": "400mg",
    "manufacturer": "Abbott Laboratories",
    "batchNumber": "BR-24C03",
    "purchasePrice": 36,
    "sellingPrice": 50,
    "stock": 18,
    "minStock": 40,
    "expiryDate": "2027-01-15",
    "prescriptionRequired": false,
    "description": "Brufen (Ibuprofen) 400mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  },
  {
    "id": "med-03",
    "name": "Amoxil",
    "genericName": "Amoxicillin",
    "brand": "GSK",
    "sku": "PHM-1003",
    "barcode": "6221000103",
    "categoryId": "cat-antibiotic",
    "dosageForm": "Capsule",
    "strength": "500mg",
    "manufacturer": "GlaxoSmithKline Pakistan",
    "batchNumber": "AM-25A07",
    "purchasePrice": 110,
    "sellingPrice": 145,
    "stock": 96,
    "minStock": 30,
    "expiryDate": "2026-12-20",
    "prescriptionRequired": true,
    "description": "Amoxil (Amoxicillin) 500mg capsule. Store below 25°C, keep away from children.",
    "supplierId": "sup-2"
  },
  {
    "id": "med-04",
    "name": "Augmentin",
    "genericName": "Amoxicillin + Clavulanate",
    "brand": "GSK",
    "sku": "PHM-1004",
    "barcode": "6221000104",
    "categoryId": "cat-antibiotic",
    "dosageForm": "Tablet",
    "strength": "625mg",
    "manufacturer": "GlaxoSmithKline Pakistan",
    "batchNumber": "AG-25D02",
    "purchasePrice": 190,
    "sellingPrice": 245,
    "stock": 40,
    "minStock": 20,
    "expiryDate": "2026-12-05",
    "prescriptionRequired": true,
    "description": "Augmentin (Amoxicillin + Clavulanate) 625mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-2"
  },
  {
    "id": "med-05",
    "name": "Ciprobid",
    "genericName": "Ciprofloxacin",
    "brand": "Bayer",
    "sku": "PHM-1005",
    "barcode": "6221000105",
    "categoryId": "cat-antibiotic",
    "dosageForm": "Tablet",
    "strength": "500mg",
    "manufacturer": "Bayer Pakistan",
    "batchNumber": "CB-26A15",
    "purchasePrice": 58,
    "sellingPrice": 80,
    "stock": 0,
    "minStock": 25,
    "expiryDate": "2027-05-31",
    "prescriptionRequired": true,
    "description": "Ciprobid (Ciprofloxacin) 500mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  },
  {
    "id": "med-06",
    "name": "Azomax",
    "genericName": "Azithromycin",
    "brand": "Abbott",
    "sku": "PHM-1006",
    "barcode": "6221000106",
    "categoryId": "cat-antibiotic",
    "dosageForm": "Tablet",
    "strength": "500mg",
    "manufacturer": "Abbott Laboratories",
    "batchNumber": "AZ-25B19",
    "purchasePrice": 150,
    "sellingPrice": 195,
    "stock": 64,
    "minStock": 20,
    "expiryDate": "2026-11-30",
    "prescriptionRequired": true,
    "description": "Azomax (Azithromycin) 500mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-3"
  },
  {
    "id": "med-07",
    "name": "Nexium",
    "genericName": "Esomeprazole",
    "brand": "AstraZeneca",
    "sku": "PHM-1007",
    "barcode": "6221000107",
    "categoryId": "cat-antacid",
    "dosageForm": "Capsule",
    "strength": "40mg",
    "manufacturer": "AstraZeneca Pakistan",
    "batchNumber": "NX-25E08",
    "purchasePrice": 210,
    "sellingPrice": 265,
    "stock": 72,
    "minStock": 20,
    "expiryDate": "2027-02-28",
    "prescriptionRequired": false,
    "description": "Nexium (Esomeprazole) 40mg capsule. Store below 25°C, keep away from children.",
    "supplierId": "sup-2"
  },
  {
    "id": "med-08",
    "name": "Gaviscon",
    "genericName": "Sodium Alginate + Antacid",
    "brand": "Reckitt",
    "sku": "PHM-1008",
    "barcode": "6221000108",
    "categoryId": "cat-antacid",
    "dosageForm": "Sachet",
    "strength": "10ml",
    "manufacturer": "Reckitt Benckiser",
    "batchNumber": "GV-25F04",
    "purchasePrice": 55,
    "sellingPrice": 75,
    "stock": 110,
    "minStock": 30,
    "expiryDate": "2027-08-31",
    "prescriptionRequired": false,
    "description": "Gaviscon (Sodium Alginate + Antacid) 10ml sachet. Store below 25°C, keep away from children.",
    "supplierId": "sup-3"
  },
  {
    "id": "med-09",
    "name": "Telfast",
    "genericName": "Fexofenadine",
    "brand": "Sanofi",
    "sku": "PHM-1009",
    "barcode": "6221000109",
    "categoryId": "cat-respiratory",
    "dosageForm": "Tablet",
    "strength": "120mg",
    "manufacturer": "Sanofi Pakistan",
    "batchNumber": "TF-25G12",
    "purchasePrice": 78,
    "sellingPrice": 100,
    "stock": 52,
    "minStock": 20,
    "expiryDate": "2027-04-30",
    "prescriptionRequired": false,
    "description": "Telfast (Fexofenadine) 120mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  },
  {
    "id": "med-10",
    "name": "Ventolin Inhaler",
    "genericName": "Salbutamol",
    "brand": "GSK",
    "sku": "PHM-1010",
    "barcode": "6221000110",
    "categoryId": "cat-respiratory",
    "dosageForm": "Inhaler",
    "strength": "100mcg",
    "manufacturer": "GlaxoSmithKline Pakistan",
    "batchNumber": "VT-25H01",
    "purchasePrice": 520,
    "sellingPrice": 640,
    "stock": 14,
    "minStock": 10,
    "expiryDate": "2027-06-30",
    "prescriptionRequired": false,
    "description": "Ventolin Inhaler (Salbutamol) 100mcg inhaler. Store below 25°C, keep away from children.",
    "supplierId": "sup-2"
  },
  {
    "id": "med-11",
    "name": "Benadryl Syrup",
    "genericName": "Diphenhydramine",
    "brand": "Pfizer",
    "sku": "PHM-1011",
    "barcode": "6221000111",
    "categoryId": "cat-respiratory",
    "dosageForm": "Syrup",
    "strength": "60ml",
    "manufacturer": "Pfizer Pakistan",
    "batchNumber": "BS-25J05",
    "purchasePrice": 135,
    "sellingPrice": 170,
    "stock": 30,
    "minStock": 12,
    "expiryDate": "2026-12-15",
    "prescriptionRequired": false,
    "description": "Benadryl Syrup (Diphenhydramine) 60ml syrup. Store below 25°C, keep away from children.",
    "supplierId": "sup-3"
  },
  {
    "id": "med-12",
    "name": "Surbex Z",
    "genericName": "Vitamin B-Complex + Zinc",
    "brand": "Abbott",
    "sku": "PHM-1012",
    "barcode": "6221000112",
    "categoryId": "cat-vitamin",
    "dosageForm": "Capsule",
    "strength": "Multi",
    "manufacturer": "Abbott Laboratories",
    "batchNumber": "SZ-25K09",
    "purchasePrice": 38,
    "sellingPrice": 55,
    "stock": 180,
    "minStock": 40,
    "expiryDate": "2028-01-31",
    "prescriptionRequired": false,
    "description": "Surbex Z (Vitamin B-Complex + Zinc) Multi capsule. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  },
  {
    "id": "med-13",
    "name": "Caltrate D",
    "genericName": "Calcium + Vitamin D3",
    "brand": "Wyeth",
    "sku": "PHM-1013",
    "barcode": "6221000113",
    "categoryId": "cat-vitamin",
    "dosageForm": "Tablet",
    "strength": "600mg",
    "manufacturer": "Wyeth Pakistan",
    "batchNumber": "CT-25L14",
    "purchasePrice": 62,
    "sellingPrice": 85,
    "stock": 66,
    "minStock": 25,
    "expiryDate": "2027-09-30",
    "prescriptionRequired": false,
    "description": "Caltrate D (Calcium + Vitamin D3) 600mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-2"
  },
  {
    "id": "med-14",
    "name": "Glucophage",
    "genericName": "Metformin",
    "brand": "Merck",
    "sku": "PHM-1014",
    "barcode": "6221000114",
    "categoryId": "cat-diabetes",
    "dosageForm": "Tablet",
    "strength": "850mg",
    "manufacturer": "Merck Pakistan",
    "batchNumber": "GF-25M02",
    "purchasePrice": 24,
    "sellingPrice": 34,
    "stock": 220,
    "minStock": 60,
    "expiryDate": "2027-07-31",
    "prescriptionRequired": true,
    "description": "Glucophage (Metformin) 850mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  },
  {
    "id": "med-15",
    "name": "Diamicron MR",
    "genericName": "Gliclazide MR",
    "brand": "Servier",
    "sku": "PHM-1015",
    "barcode": "6221000115",
    "categoryId": "cat-diabetes",
    "dosageForm": "Tablet",
    "strength": "60mg",
    "manufacturer": "Servier Pakistan",
    "batchNumber": "DM-25N11",
    "purchasePrice": 48,
    "sellingPrice": 65,
    "stock": 75,
    "minStock": 30,
    "expiryDate": "2027-02-28",
    "prescriptionRequired": true,
    "description": "Diamicron MR (Gliclazide MR) 60mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-3"
  },
  {
    "id": "med-16",
    "name": "Lantus SoloStar",
    "genericName": "Insulin Glargine",
    "brand": "Sanofi",
    "sku": "PHM-1016",
    "barcode": "6221000116",
    "categoryId": "cat-diabetes",
    "dosageForm": "Injection",
    "strength": "100IU/ml",
    "manufacturer": "Sanofi Pakistan",
    "batchNumber": "LS-25P03",
    "purchasePrice": 1450,
    "sellingPrice": 1690,
    "stock": 8,
    "minStock": 6,
    "expiryDate": "2027-01-31",
    "prescriptionRequired": true,
    "description": "Lantus SoloStar (Insulin Glargine) 100IU/ml injection. Store below 25°C, keep away from children.",
    "supplierId": "sup-3"
  },
  {
    "id": "med-17",
    "name": "Concor",
    "genericName": "Bisoprolol",
    "brand": "Merck",
    "sku": "PHM-1017",
    "barcode": "6221000117",
    "categoryId": "cat-cardio",
    "dosageForm": "Tablet",
    "strength": "5mg",
    "manufacturer": "Merck Pakistan",
    "batchNumber": "CN-25Q06",
    "purchasePrice": 32,
    "sellingPrice": 45,
    "stock": 140,
    "minStock": 40,
    "expiryDate": "2027-10-31",
    "prescriptionRequired": true,
    "description": "Concor (Bisoprolol) 5mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  },
  {
    "id": "med-18",
    "name": "Norvasc",
    "genericName": "Amlodipine",
    "brand": "Pfizer",
    "sku": "PHM-1018",
    "barcode": "6221000118",
    "categoryId": "cat-cardio",
    "dosageForm": "Tablet",
    "strength": "5mg",
    "manufacturer": "Pfizer Pakistan",
    "batchNumber": "NV-25R08",
    "purchasePrice": 28,
    "sellingPrice": 40,
    "stock": 190,
    "minStock": 50,
    "expiryDate": "2027-06-30",
    "prescriptionRequired": true,
    "description": "Norvasc (Amlodipine) 5mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-2"
  },
  {
    "id": "med-19",
    "name": "Plavix",
    "genericName": "Clopidogrel",
    "brand": "Sanofi",
    "sku": "PHM-1019",
    "barcode": "6221000119",
    "categoryId": "cat-cardio",
    "dosageForm": "Tablet",
    "strength": "75mg",
    "manufacturer": "Sanofi Pakistan",
    "batchNumber": "PL-24S01",
    "purchasePrice": 70,
    "sellingPrice": 95,
    "stock": 44,
    "minStock": 20,
    "expiryDate": "2026-10-31",
    "prescriptionRequired": true,
    "description": "Plavix (Clopidogrel) 75mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-3"
  },
  {
    "id": "med-20",
    "name": "Betadine Solution",
    "genericName": "Povidone-Iodine",
    "brand": "Mundipharma",
    "sku": "PHM-1020",
    "barcode": "6221000120",
    "categoryId": "cat-personal",
    "dosageForm": "Ointment",
    "strength": "10%",
    "manufacturer": "Mundipharma",
    "batchNumber": "BT-25T10",
    "purchasePrice": 95,
    "sellingPrice": 120,
    "stock": 26,
    "minStock": 15,
    "expiryDate": "2028-03-31",
    "prescriptionRequired": false,
    "description": "Betadine Solution (Povidone-Iodine) 10% ointment. Store below 25°C, keep away from children.",
    "supplierId": "sup-2"
  },
  {
    "id": "med-21",
    "name": "Lacto Calamine",
    "genericName": "Calamine + Zinc Oxide",
    "brand": "Glaxo",
    "sku": "PHM-1021",
    "barcode": "6221000121",
    "categoryId": "cat-personal",
    "dosageForm": "Lotion",
    "strength": "120ml",
    "manufacturer": "GlaxoSmithKline Pakistan",
    "batchNumber": "LC-25U04",
    "purchasePrice": 210,
    "sellingPrice": 260,
    "stock": 19,
    "minStock": 10,
    "expiryDate": "2027-11-30",
    "prescriptionRequired": false,
    "description": "Lacto Calamine (Calamine + Zinc Oxide) 120ml lotion. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  },
  {
    "id": "med-22",
    "name": "Otrivin Nasal",
    "genericName": "Xylometazoline",
    "brand": "Novartis",
    "sku": "PHM-1022",
    "barcode": "6221000122",
    "categoryId": "cat-respiratory",
    "dosageForm": "Drops",
    "strength": "0.1%",
    "manufacturer": "Novartis Pharma",
    "batchNumber": "OT-25V07",
    "purchasePrice": 88,
    "sellingPrice": 115,
    "stock": 34,
    "minStock": 15,
    "expiryDate": "2026-11-10",
    "prescriptionRequired": false,
    "description": "Otrivin Nasal (Xylometazoline) 0.1% drops. Store below 25°C, keep away from children.",
    "supplierId": "sup-3"
  },
  {
    "id": "med-23",
    "name": "Flagyl",
    "genericName": "Metronidazole",
    "brand": "Pfizer",
    "sku": "PHM-1023",
    "barcode": "6221000123",
    "categoryId": "cat-antibiotic",
    "dosageForm": "Tablet",
    "strength": "400mg",
    "manufacturer": "Pfizer Pakistan",
    "batchNumber": "FG-25W11",
    "purchasePrice": 18,
    "sellingPrice": 28,
    "stock": 300,
    "minStock": 60,
    "expiryDate": "2027-12-31",
    "prescriptionRequired": true,
    "description": "Flagyl (Metronidazole) 400mg tablet. Store below 25°C, keep away from children.",
    "supplierId": "sup-2"
  },
  {
    "id": "med-24",
    "name": "Panadol Syrup",
    "genericName": "Paracetamol",
    "brand": "GSK",
    "sku": "PHM-1024",
    "barcode": "6221000124",
    "categoryId": "cat-analgesic",
    "dosageForm": "Syrup",
    "strength": "125mg/5ml",
    "manufacturer": "GlaxoSmithKline Pakistan",
    "batchNumber": "PS-25X02",
    "purchasePrice": 85,
    "sellingPrice": 110,
    "stock": 9,
    "minStock": 12,
    "expiryDate": "2026-12-31",
    "prescriptionRequired": false,
    "description": "Panadol Syrup (Paracetamol) 125mg/5ml syrup. Store below 25°C, keep away from children.",
    "supplierId": "sup-1"
  }
];

export const customers = [
  {
    "id": "cus-01",
    "name": "Ayesha Siddiqui",
    "phone": "0300-1234567",
    "email": "ayesha.s@gmail.com",
    "address": "House 12, Block 4, Gulshan-e-Iqbal, Karachi",
    "dateOfBirth": "1988-04-12",
    "loyaltyPoints": 420,
    "totalPurchases": 58340,
    "lastPurchase": "2026-11-24T18:10:00"
  },
  {
    "id": "cus-02",
    "name": "Muhammad Bilal",
    "phone": "0321-7654321",
    "email": "bilal.khan@outlook.com",
    "address": "Street 9, F-10 Markaz, Islamabad",
    "dateOfBirth": "1975-09-03",
    "loyaltyPoints": 1180,
    "totalPurchases": 142900,
    "lastPurchase": "2026-11-25T11:42:00"
  },
  {
    "id": "cus-03",
    "name": "Fatima Noor",
    "phone": "0333-9876543",
    "email": "fatima.noor@yahoo.com",
    "address": "Model Town, Lahore",
    "loyaltyPoints": 95,
    "totalPurchases": 12450,
    "lastPurchase": "2026-11-18T09:20:00"
  },
  {
    "id": "cus-04",
    "name": "Hamza Qadir",
    "phone": "0312-4455667",
    "email": "hamza.q@gmail.com",
    "address": "Hayatabad Phase 3, Peshawar",
    "dateOfBirth": "1992-01-27",
    "loyaltyPoints": 310,
    "totalPurchases": 33120,
    "lastPurchase": "2026-11-21T16:05:00"
  },
  {
    "id": "cus-05",
    "name": "Sana Malik",
    "phone": "0345-2233445",
    "email": "sana.malik@gmail.com",
    "address": "DHA Phase 6, Lahore",
    "dateOfBirth": "1981-06-19",
    "loyaltyPoints": 770,
    "totalPurchases": 89600,
    "lastPurchase": "2026-11-23T13:30:00"
  },
  {
    "id": "cus-06",
    "name": "Omar Farooq",
    "phone": "0300-8899001",
    "email": "omar.f@gmail.com",
    "address": "Johar Town, Lahore",
    "loyaltyPoints": 40,
    "totalPurchases": 6780,
    "lastPurchase": "2026-10-30T10:00:00"
  },
  {
    "id": "cus-07",
    "name": "Zainab Hassan",
    "phone": "0321-5566778",
    "email": "zainab.h@hotmail.com",
    "address": "Clifton Block 5, Karachi",
    "dateOfBirth": "1995-11-08",
    "loyaltyPoints": 225,
    "totalPurchases": 24300,
    "lastPurchase": "2026-11-22T19:45:00"
  },
  {
    "id": "cus-08",
    "name": "Ali Raza",
    "phone": "0313-1020304",
    "email": "ali.raza@gmail.com",
    "address": "Satellite Town, Rawalpindi",
    "loyaltyPoints": 610,
    "totalPurchases": 71250,
    "lastPurchase": "2026-11-20T12:15:00"
  },
  {
    "id": "cus-09",
    "name": "Mehwish Tariq",
    "phone": "0345-7070808",
    "email": "mehwish.t@gmail.com",
    "address": "Bahria Town, Islamabad",
    "dateOfBirth": "1990-02-14",
    "loyaltyPoints": 180,
    "totalPurchases": 18900,
    "lastPurchase": "2026-11-15T15:00:00"
  },
  {
    "id": "cus-10",
    "name": "Usman Ghani",
    "phone": "0300-6060606",
    "email": "usman.g@gmail.com",
    "address": "Gulberg III, Lahore",
    "loyaltyPoints": 0,
    "totalPurchases": 1450,
    "lastPurchase": null
  }
];

export const purchases = [
  {
    "id": "pur-1001",
    "supplierId": "sup-1",
    "invoiceNumber": "HTP-88412",
    "purchaseDate": "2026-11-02",
    "expectedDelivery": "2026-11-05",
    "status": "Received",
    "paymentStatus": "Paid",
    "items": [
      {
        "medicineId": "med-01",
        "quantity": 300,
        "unitPrice": 42,
        "receivedQuantity": 300
      },
      {
        "medicineId": "med-14",
        "quantity": 300,
        "unitPrice": 24,
        "receivedQuantity": 300
      }
    ],
    "total": 19800,
    "notes": ""
  },
  {
    "id": "pur-1002",
    "supplierId": "sup-2",
    "invoiceNumber": "LMT-20391",
    "purchaseDate": "2026-11-10",
    "expectedDelivery": "2026-11-12",
    "status": "Partially Received",
    "paymentStatus": "Partial",
    "items": [
      {
        "medicineId": "med-03",
        "quantity": 120,
        "unitPrice": 110,
        "receivedQuantity": 96
      },
      {
        "medicineId": "med-04",
        "quantity": 60,
        "unitPrice": 190,
        "receivedQuantity": 40
      }
    ],
    "total": 24600,
    "notes": "Short-supplied balance, follow up with rep."
  },
  {
    "id": "pur-1003",
    "supplierId": "sup-3",
    "invoiceNumber": "CWP-55107",
    "purchaseDate": "2026-11-18",
    "expectedDelivery": "2026-11-22",
    "status": "Pending",
    "paymentStatus": "Unpaid",
    "items": [
      {
        "medicineId": "med-16",
        "quantity": 10,
        "unitPrice": 1450,
        "receivedQuantity": 0
      },
      {
        "medicineId": "med-18",
        "quantity": 200,
        "unitPrice": 28,
        "receivedQuantity": 0
      }
    ],
    "total": 20100,
    "notes": ""
  },
  {
    "id": "pur-1004",
    "supplierId": "sup-1",
    "invoiceNumber": "HTP-88590",
    "purchaseDate": "2026-11-24",
    "expectedDelivery": "2026-11-28",
    "status": "Draft",
    "paymentStatus": "Unpaid",
    "items": [
      {
        "medicineId": "med-06",
        "quantity": 100,
        "unitPrice": 150,
        "receivedQuantity": 0
      }
    ],
    "total": 15000,
    "notes": ""
  },
  {
    "id": "pur-1005",
    "supplierId": "sup-2",
    "invoiceNumber": "LMT-20422",
    "purchaseDate": "2026-10-28",
    "expectedDelivery": "2026-11-01",
    "status": "Cancelled",
    "paymentStatus": "Unpaid",
    "items": [
      {
        "medicineId": "med-10",
        "quantity": 20,
        "unitPrice": 520,
        "receivedQuantity": 0
      }
    ],
    "total": 10400,
    "notes": "Supplier out of stock."
  },
  {
    "id": "pur-1006",
    "supplierId": "sup-3",
    "invoiceNumber": "CWP-55022",
    "purchaseDate": "2026-10-15",
    "expectedDelivery": "2026-10-18",
    "status": "Received",
    "paymentStatus": "Paid",
    "items": [
      {
        "medicineId": "med-08",
        "quantity": 150,
        "unitPrice": 55,
        "receivedQuantity": 150
      },
      {
        "medicineId": "med-23",
        "quantity": 300,
        "unitPrice": 18,
        "receivedQuantity": 300
      }
    ],
    "total": 13650,
    "notes": ""
  }
];

export const prescriptions = [
  {
    "id": "RX-2611-001",
    "patientName": "Ayesha Siddiqui",
    "patientPhone": "0300-1234567",
    "doctorName": "Dr. Saima Rehman",
    "doctorContact": "0300-5550101",
    "date": "2026-11-25",
    "medicines": [
      {
        "medicineId": "med-03",
        "quantity": 21,
        "dosageNote": "1 capsule twice daily for 7 days"
      }
    ],
    "status": "Pending",
    "notes": ""
  },
  {
    "id": "RX-2611-002",
    "patientName": "Muhammad Bilal",
    "patientPhone": "0321-7654321",
    "doctorName": "Dr. Kamran Yousaf",
    "doctorContact": "0321-5550202",
    "date": "2026-11-24",
    "medicines": [
      {
        "medicineId": "med-14",
        "quantity": 60,
        "dosageNote": "As prescribed by doctor"
      },
      {
        "medicineId": "med-17",
        "quantity": 30,
        "dosageNote": "Once daily"
      }
    ],
    "status": "Verified",
    "notes": "Verified against prescriber record."
  },
  {
    "id": "RX-2611-003",
    "patientName": "Hamza Qadir",
    "patientPhone": "0312-4455667",
    "doctorName": "Dr. Naveed Akbar",
    "doctorContact": "0312-5550303",
    "date": "2026-11-24",
    "medicines": [
      {
        "medicineId": "med-06",
        "quantity": 6,
        "dosageNote": "500mg once daily for 3 days"
      }
    ],
    "status": "Dispensed",
    "notes": ""
  },
  {
    "id": "RX-2611-004",
    "patientName": "Sana Malik",
    "patientPhone": "0345-2233445",
    "doctorName": "Dr. Farah Ijaz",
    "doctorContact": "0345-5550404",
    "date": "2026-11-23",
    "medicines": [
      {
        "medicineId": "med-18",
        "quantity": 30,
        "dosageNote": "Once daily"
      }
    ],
    "status": "Dispensed",
    "notes": ""
  },
  {
    "id": "RX-2611-005",
    "patientName": "Omar Farooq",
    "patientPhone": "0300-8899001",
    "doctorName": "Dr. Waqar Hussain",
    "doctorContact": "0300-5550505",
    "date": "2026-11-22",
    "medicines": [
      {
        "medicineId": "med-05",
        "quantity": 10,
        "dosageNote": "Dose to be confirmed by prescriber"
      }
    ],
    "status": "Rejected",
    "notes": "Prescription illegible in dosage field. Prescriber asked to resubmit."
  },
  {
    "id": "RX-2611-006",
    "patientName": "Zainab Hassan",
    "patientPhone": "0321-5566778",
    "doctorName": "Dr. Saima Rehman",
    "doctorContact": "0300-5550101",
    "date": "2026-11-25",
    "medicines": [
      {
        "medicineId": "med-15",
        "quantity": 30,
        "dosageNote": "Once daily before breakfast"
      },
      {
        "medicineId": "med-14",
        "quantity": 60,
        "dosageNote": "Twice daily with meals"
      }
    ],
    "status": "Pending",
    "notes": ""
  },
  {
    "id": "RX-2611-007",
    "patientName": "Ali Raza",
    "patientPhone": "0313-1020304",
    "doctorName": "Dr. Kamran Yousaf",
    "doctorContact": "0321-5550202",
    "date": "2026-11-20",
    "medicines": [
      {
        "medicineId": "med-09",
        "quantity": 10,
        "dosageNote": "Once daily"
      }
    ],
    "status": "Dispensed",
    "notes": ""
  }
];

export const staff = [
  {
    "id": "stf-01",
    "name": "Michael Carter",
    "email": "michael.carter@medipos.pk",
    "phone": "0300-1112233",
    "role": "Admin",
    "status": "Active",
    "joiningDate": "2021-03-01"
  },
  {
    "id": "stf-02",
    "name": "Dr. Rabia Anwar",
    "email": "rabia.anwar@medipos.pk",
    "phone": "0321-2223344",
    "role": "Pharmacist",
    "status": "Active",
    "joiningDate": "2022-07-15"
  },
  {
    "id": "stf-03",
    "name": "Kashif Ali",
    "email": "kashif.ali@medipos.pk",
    "phone": "0333-3334455",
    "role": "Cashier",
    "status": "Active",
    "joiningDate": "2023-01-10"
  },
  {
    "id": "stf-04",
    "name": "Bushra Jabeen",
    "email": "bushra.j@medipos.pk",
    "phone": "0312-4445566",
    "role": "Cashier",
    "status": "On Leave",
    "joiningDate": "2023-09-01"
  },
  {
    "id": "stf-05",
    "name": "Tariq Mahmood",
    "email": "tariq.m@medipos.pk",
    "phone": "0345-5556677",
    "role": "Inventory Manager",
    "status": "Active",
    "joiningDate": "2022-02-20"
  },
  {
    "id": "stf-06",
    "name": "Noor-ul-Ain",
    "email": "noor.ua@medipos.pk",
    "phone": "0300-6667788",
    "role": "Pharmacist",
    "status": "Inactive",
    "joiningDate": "2020-11-05"
  }
];

export const activity = [
  {
    "id": "act-1",
    "message": "Sale MP-000142 completed for Muhammad Bilal",
    "time": "2026-11-25T11:42:00",
    "kind": "sale"
  },
  {
    "id": "act-2",
    "message": "Prescription RX-2611-002 verified by Dr. Rabia Anwar",
    "time": "2026-11-25T10:15:00",
    "kind": "prescription"
  },
  {
    "id": "act-3",
    "message": "Stock received for PO HTP-88412 (Panadol Extra, Glucophage)",
    "time": "2026-11-24T16:00:00",
    "kind": "purchase"
  },
  {
    "id": "act-4",
    "message": "Low stock alert: Ventolin Inhaler (14 left)",
    "time": "2026-11-24T09:30:00",
    "kind": "stock"
  },
  {
    "id": "act-5",
    "message": "Batch PX-24B11 near expiry: 2 months remaining",
    "time": "2026-11-23T08:00:00",
    "kind": "system"
  },
  {
    "id": "act-6",
    "message": "Stock adjusted: Otrivin Nasal −2 (damaged bottle)",
    "time": "2026-11-22T14:20:00",
    "kind": "stock"
  }
];

export const storeProfile = {
  "pharmacyName": "MediPOS Pharmacy",
  "legalName": "MediPOS Pharmacy (Pvt) Ltd",
  "licenseNumber": "DRAP-SD-2219-PH",
  "ntn": "1234567-8",
  "phone": "+92 21 3456 7890",
  "email": "counter@medipos.pk",
  "address": "Shop 3, Tariq Road, Block 2, PECHS",
  "city": "Karachi",
  "currency": "PKR",
  "timezone": "Asia/Karachi",
  "taxRate": 17,
  "taxInclusive": false,
  "invoicePrefix": "MP",
  "invoiceFooter": "Medicines once sold are not returnable. Thank you for trusting MediPOS.",
  "receiptPaperWidth": "80mm",
  "lowStockAlerts": true,
  "expiryAlerts": true,
  "dailySummaryEmail": false,
  "paymentsEnabled": {
    "Cash": true,
    "Card": true,
    "Bank Transfer": true,
    "JazzCash": true,
    "EasyPaisa": true
  }
};

