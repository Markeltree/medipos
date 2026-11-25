/*
 * Runs the API against a throwaway in-memory MongoDB, seeded with the demo data.
 * Handy for trying the app without Atlas. Everything is lost when it stops.
 *   npm run dev:memory
 * Demo staff log in with SEED_STAFF_PASSWORD (default "medipos-demo").
 */
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { seedBusinessData, seedStaff } from "../src/seed/seed.js";

const password = process.env.SEED_STAFF_PASSWORD || "medipos-demo";
const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
const uri = replSet.getUri("medipos");

await mongoose.connect(uri);
await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).createIndexes()));
await seedBusinessData();
await seedStaff(password);

const config = loadConfig({
  ...process.env,
  MONGODB_URI: uri,
  JWT_SECRET: process.env.JWT_SECRET || randomBytes(48).toString("base64url"),
  ALLOW_DEMO_RESET: "true",
});
createApp(config).listen(config.port, () => {
  console.log(`MediPOS API (in-memory database) on http://localhost:${config.port}/api`);
  console.log(`Sign in as michael.carter@medipos.pk (Admin) with password "${password}"`);
});

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  await replSet.stop();
  process.exit(0);
});
