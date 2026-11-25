import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

/* Runs the Vercel entry point (api/index.js) the way Vercel calls it: a plain (req, res) handler. */

let replSet;
let server;
before(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri("medipos");
  process.env.JWT_SECRET = "y".repeat(40);
  process.env.NODE_ENV = "test";
  process.env.SEED_STAFF_PASSWORD = "handler-pass-1";

  // Seed through a separate connection, then close it so the handler opens its own.
  const { seedBusinessData, seedStaff } = await import("../src/seed/seed.js");
  await mongoose.connect(process.env.MONGODB_URI);
  await seedBusinessData();
  await seedStaff("handler-pass-1");
  await mongoose.disconnect();

  const { default: handler } = await import("../api/index.js");
  server = createServer(handler);
});
after(async () => {
  server?.close();
  await mongoose.disconnect();
  await replSet?.stop();
});

test("handler connects on first request and serves the API", async () => {
  const health = await request(server).get("/api/health");
  assert.equal(health.status, 200);
  assert.equal(mongoose.connection.readyState, 1);

  const login = await request(server)
    .post("/api/auth/login")
    .send({ email: "michael.carter@medipos.pk", password: "handler-pass-1" });
  assert.equal(login.status, 200);

  const boot = await request(server).get("/api/bootstrap").set("Authorization", `Bearer ${login.body.token}`);
  assert.equal(boot.status, 200);
  assert.equal(boot.body.medicines.length, 24);
});

test("unknown paths get a JSON 404", async () => {
  const res = await request(server).get("/nope");
  assert.equal(res.status, 404);
  assert.match(res.body.error, /No route/);
});
