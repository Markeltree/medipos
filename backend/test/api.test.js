import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { EMAILS, PASSWORD, startTestServer } from "./helpers.js";
import { calcTotals } from "../src/services/sales.js";

let srv;
before(async () => {
  srv = await startTestServer({ allowDemoReset: true });
});
after(async () => {
  await srv?.stop();
});

const medicine = async (who, id) => (await (await srv.as(who)).get(`/api/medicines/${id}`)).body;

describe("auth", () => {
  test("rejects a wrong password without saying whether the email exists", async () => {
    const wrong = await srv.api.post("/api/auth/login").send({ email: EMAILS.admin, password: "nope-nope" });
    const unknown = await srv.api.post("/api/auth/login").send({ email: "nobody@x.pk", password: "nope-nope" });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.error, unknown.body.error);
  });

  test("login returns a token and the user without any password hash", async () => {
    const res = await srv.api.post("/api/auth/login").send({ email: EMAILS.admin.toUpperCase(), password: PASSWORD });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.name, "Michael Carter");
    assert.equal(res.body.user.role, "Admin");
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user._id, undefined);
  });

  test("inactive staff cannot sign in", async () => {
    const res = await srv.api.post("/api/auth/login").send({ email: EMAILS.inactive, password: PASSWORD });
    assert.equal(res.status, 403);
  });

  test("API needs a valid token", async () => {
    assert.equal((await srv.api.get("/api/medicines")).status, 401);
    const bad = await srv.api.get("/api/medicines").set("Authorization", "Bearer not-a-token");
    assert.equal(bad.status, 401);
  });

  test("rejects unknown fields such as Mongo operators", async () => {
    const res = await srv.api.post("/api/auth/login").send({ email: { $ne: "" }, password: PASSWORD });
    assert.equal(res.status, 400);
  });
});

describe("bootstrap", () => {
  test("returns every collection in the frontend's shapes", async () => {
    const res = await (await srv.as("cashier")).get("/api/bootstrap");
    assert.equal(res.status, 200);
    const b = res.body;
    assert.equal(b.me.email, EMAILS.cashier);
    assert.equal(b.medicines.length, 24);
    assert.equal(b.medicines[0].id, "med-01", "seed order kept");
    assert.equal(b.categories[0].id, "cat-analgesic");
    assert.equal(b.sales.length, 1920);
    assert.ok(b.sales.every((s, i) => i === 0 || b.sales[i - 1].date >= s.date), "newest sale first");
    assert.equal(b.profile.taxRate, 17);
    assert.equal(b.profile.id, undefined);
    assert.ok(b.staff.every((s) => s.passwordHash === undefined));
  });
});

describe("roles", () => {
  test("a cashier cannot edit the catalogue, staff or settings", async () => {
    const cashier = await srv.as("cashier");
    assert.equal((await cashier.patch("/api/medicines/med-01", { sellingPrice: 1 })).status, 403);
    assert.equal((await cashier.patch("/api/settings", { taxRate: 0 })).status, 403);
    assert.equal((await cashier.delete("/api/staff/stf-02")).status, 403);
    assert.equal((await cashier.post("/api/sales/MP-001900/refund")).status, 403);
  });

  test("an inventory manager can adjust stock but cannot sell", async () => {
    const inv = await srv.as("inventory");
    const res = await inv.post("/api/medicines/med-01/adjust-stock", { delta: 5, type: "Stock In", reference: "Count" });
    assert.equal(res.status, 200);
    assert.equal(res.body.changes.movements[0].user, "Tariq Mahmood");
    const sale = await inv.post("/api/sales", { items: [{ medicineId: "med-01", quantity: 1 }], paymentMethod: "Card" });
    assert.equal(sale.status, 403);
  });
});

describe("sales", () => {
  test("server prices the sale, takes stock and credits the customer", async () => {
    const cashier = await srv.as("cashier");
    const before = await medicine("cashier", "med-02"); // Brufen, Rs 50
    const customerBefore = (await cashier.get("/api/customers/cus-03")).body;

    const res = await cashier.post("/api/sales", {
      customerId: "cus-03",
      items: [{ medicineId: "med-02", quantity: 2, discount: 10 }],
      orderDiscount: { type: "percent", value: 10 },
      paymentMethod: "Cash",
      amountReceived: 500,
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const sale = res.body.changes.sales[0];
    // 2 x 50 = 100, -10 line = 90, -10% = 81, +17% tax = 13.77 -> 14
    assert.equal(sale.subtotal, 100);
    assert.equal(sale.discount, 19);
    assert.equal(sale.tax, 14);
    assert.equal(sale.total, 95);
    assert.equal(sale.change, 405);
    assert.equal(sale.cashier, "Kashif Ali");
    assert.equal(sale.id, "MP-001921", "continues the invoice sequence");

    assert.equal(res.body.changes.medicines[0].stock, before.stock - 2);
    assert.equal(res.body.changes.movements[0].type, "Sale");
    const customer = res.body.changes.customers[0];
    assert.equal(customer.totalPurchases, customerBefore.totalPurchases + 95);
    assert.equal(customer.loyaltyPoints, customerBefore.loyaltyPoints + 0);
  });

  test("a sale that asks for more than the stock fails and changes nothing", async () => {
    const cashier = await srv.as("cashier");
    const amoxil = await medicine("cashier", "med-03");
    const res = await cashier.post("/api/sales", {
      items: [
        { medicineId: "med-03", quantity: 1 },
        { medicineId: "med-05", quantity: 1 }, // Ciprobid has 0 in stock
      ],
      paymentMethod: "Card",
    });
    assert.equal(res.status, 409);
    assert.match(res.body.error, /Not enough stock for Ciprobid/);
    assert.equal((await medicine("cashier", "med-03")).stock, amoxil.stock, "first line rolled back");
  });

  test("cash below the total is refused", async () => {
    const res = await (await srv.as("cashier")).post("/api/sales", {
      items: [{ medicineId: "med-01", quantity: 1 }],
      paymentMethod: "Cash",
      amountReceived: 1,
    });
    assert.equal(res.status, 400);
  });

  test("refund restocks once and reverses the customer's totals", async () => {
    const cashier = await srv.as("cashier");
    const pharmacist = await srv.as("pharmacist");
    const sold = await cashier.post("/api/sales", {
      customerId: "cus-02",
      items: [{ medicineId: "med-16", quantity: 1 }], // Lantus, Rs 1,690
      paymentMethod: "Card",
    });
    const sale = sold.body.changes.sales[0];
    const afterSale = sold.body.changes.customers[0];

    const res = await pharmacist.post(`/api/sales/${sale.id}/refund`);
    assert.equal(res.status, 200);
    assert.equal(res.body.changes.sales[0].paymentStatus, "Refunded");
    assert.equal(res.body.changes.medicines[0].stock, sold.body.changes.medicines[0].stock + 1);
    assert.equal(res.body.changes.customers[0].totalPurchases, afterSale.totalPurchases - sale.total);
    assert.equal(res.body.changes.customers[0].loyaltyPoints, afterSale.loyaltyPoints - Math.floor(sale.total / 100));

    assert.equal((await pharmacist.post(`/api/sales/${sale.id}/refund`)).status, 409, "no double refund");
  });

  test("calcTotals matches the frontend for tax-inclusive prices", () => {
    const t = calcTotals([{ unitPrice: 117, quantity: 1, discount: 0 }], { type: "fixed", value: 0 }, 17, true);
    assert.deepEqual([t.tax, t.total], [17, 117]);
  });
});

describe("purchases", () => {
  test("create, send, receive in two parts", async () => {
    const inv = await srv.as("inventory");
    const created = await inv.post("/api/purchases", {
      supplierId: "sup-1",
      purchaseDate: "2026-11-26",
      expectedDelivery: "2026-11-28",
      status: "Draft",
      paymentStatus: "Unpaid",
      items: [{ medicineId: "med-07", quantity: 10, unitPrice: 30 }],
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const po = created.body.changes.purchases[0];
    assert.equal(po.invoiceNumber, "PO-0001");
    assert.equal(po.total, 300);

    assert.equal((await inv.post(`/api/purchases/${po.id}/receive`, { received: { "med-07": 1 } })).status, 409, "draft cannot be received");
    assert.equal((await inv.patch(`/api/purchases/${po.id}/status`, { status: "Pending" })).status, 200);

    const stock0 = (await medicine("inventory", "med-07")).stock;
    const part = await inv.post(`/api/purchases/${po.id}/receive`, { received: { "med-07": 4 } });
    assert.equal(part.body.changes.purchases[0].status, "Partially Received");
    const rest = await inv.post(`/api/purchases/${po.id}/receive`, { received: { "med-07": 50 } });
    assert.equal(rest.body.changes.purchases[0].status, "Received");
    assert.equal(rest.body.changes.purchases[0].items[0].receivedQuantity, 10, "capped at the ordered quantity");
    assert.equal((await medicine("inventory", "med-07")).stock, stock0 + 10);
  });
});

describe("prescriptions", () => {
  test("only verified prescriptions can be dispensed, and dispensing takes stock", async () => {
    const ph = await srv.as("pharmacist");
    assert.equal((await ph.patch("/api/prescriptions/RX-2611-001/status", { status: "Dispensed" })).status, 409);
    assert.equal((await ph.patch("/api/prescriptions/RX-2611-001/status", { status: "Verified", notes: "ok" })).status, 200);

    const amoxil = await medicine("pharmacist", "med-03");
    const res = await ph.patch("/api/prescriptions/RX-2611-001/status", { status: "Dispensed" });
    assert.equal(res.status, 200);
    assert.equal(res.body.changes.prescriptions[0].notes, "ok", "notes kept when not sent");
    assert.equal(res.body.changes.medicines[0].stock, amoxil.stock - 21);
    assert.equal((await (await srv.as("cashier")).patch("/api/prescriptions/RX-2611-006/status", { status: "Verified" })).status, 403);
  });
});

describe("catalogue and people", () => {
  test("medicine edits keep unsent fields and log stock changes", async () => {
    const inv = await srv.as("inventory");
    const before = await medicine("inventory", "med-10");
    const res = await inv.patch("/api/medicines/med-10", { stock: before.stock + 3 });
    assert.equal(res.status, 200);
    const after = res.body.changes.medicines[0];
    assert.equal(after.barcode, before.barcode);
    assert.equal(after.description, before.description);
    assert.equal(res.body.changes.movements[0].quantity, 3);
  });

  test("a category in use cannot be deleted", async () => {
    const res = await (await srv.as("admin")).delete("/api/categories/cat-analgesic");
    assert.equal(res.status, 409);
  });

  test("client-chosen ids are kept, and duplicates are refused", async () => {
    const admin = await srv.as("admin");
    const body = { id: "cat-test123", name: "Test", description: "" };
    assert.equal((await admin.post("/api/categories", body)).body.changes.categories[0].id, "cat-test123");
    assert.equal((await admin.post("/api/categories", body)).status, 409);
  });

  test("loyalty redemption cannot go below zero", async () => {
    const cashier = await srv.as("cashier");
    const res = await cashier.post("/api/customers/cus-10/redeem", { points: 500 });
    assert.equal(res.status, 409);
  });

  test("admin creates staff who can then sign in; admins cannot demote themselves", async () => {
    const admin = await srv.as("admin");
    const created = await admin.post("/api/staff", {
      name: "Jessica Moore",
      email: "Jessica.Moore@medipos.pk",
      phone: "0300-0000000",
      role: "Cashier",
      joiningDate: "2026-11-26",
      password: "new-staff-pass",
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const login = await srv.api.post("/api/auth/login").send({ email: "jessica.moore@medipos.pk", password: "new-staff-pass" });
    assert.equal(login.status, 200);

    assert.equal((await admin.patch("/api/staff/stf-01", { role: "Cashier" })).status, 400);
    assert.equal((await admin.delete("/api/staff/stf-01")).status, 400);
  });

  test("deactivating a staff member blocks their existing token", async () => {
    const admin = await srv.as("admin");
    const pharmacist = await srv.as("pharmacist");
    assert.equal((await pharmacist.get("/api/medicines")).status, 200);
    await admin.patch("/api/staff/stf-02", { status: "Inactive" });
    assert.equal((await pharmacist.get("/api/medicines")).status, 401);
    await admin.patch("/api/staff/stf-02", { status: "Active" });
  });

  test("settings merge payment toggles", async () => {
    const admin = await srv.as("admin");
    const res = await admin.patch("/api/settings", { paymentsEnabled: { JazzCash: false } });
    assert.equal(res.status, 200);
    assert.equal(res.body.changes.profile.paymentsEnabled.JazzCash, false);
    assert.equal(res.body.changes.profile.paymentsEnabled.Cash, true);
    const sale = await (await srv.as("cashier")).post("/api/sales", { items: [{ medicineId: "med-01", quantity: 1 }], paymentMethod: "JazzCash" });
    assert.equal(sale.status, 400);
    await admin.patch("/api/settings", { paymentsEnabled: { JazzCash: true } });
  });

  test("demo reset restores data but keeps staff logins", async () => {
    const admin = await srv.as("admin");
    assert.equal((await admin.post("/api/demo/reset")).status, 200);
    const b = (await admin.get("/api/bootstrap")).body;
    assert.equal(b.sales.length, 1920);
    assert.ok(b.staff.some((s) => s.email === "jessica.moore@medipos.pk"));
  });
});
