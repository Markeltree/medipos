import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { seedBusinessData, seedStaff } from "../src/seed/seed.js";

export const PASSWORD = "test-password-123";
export const EMAILS = {
  admin: "michael.carter@medipos.pk",
  pharmacist: "rabia.anwar@medipos.pk",
  cashier: "kashif.ali@medipos.pk",
  inventory: "tariq.m@medipos.pk",
  inactive: "noor.ua@medipos.pk",
};

/** Starts a throwaway single-node replica set (transactions need one) and seeds it. */
export async function startTestServer({ allowDemoReset = false } = {}) {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).createIndexes()));
  await seedBusinessData();
  await seedStaff(PASSWORD);

  const config = loadConfig({
    MONGODB_URI: uri,
    JWT_SECRET: "x".repeat(40),
    NODE_ENV: "test",
    ALLOW_DEMO_RESET: String(allowDemoReset),
  });
  const app = createApp(config);
  const api = request(app);

  const tokens = {};
  async function as(who) {
    if (!tokens[who]) {
      const res = await api.post("/api/auth/login").send({ email: EMAILS[who], password: PASSWORD });
      if (res.status !== 200) throw new Error(`login as ${who} failed: ${res.status} ${JSON.stringify(res.body)}`);
      tokens[who] = res.body.token;
    }
    const auth = (req) => req.set("Authorization", `Bearer ${tokens[who]}`);
    return {
      get: (url) => auth(api.get(url)),
      post: (url, body) => auth(api.post(url)).send(body ?? {}),
      patch: (url, body) => auth(api.patch(url)).send(body ?? {}),
      delete: (url) => auth(api.delete(url)),
    };
  }

  async function stop() {
    await mongoose.disconnect();
    await replSet.stop();
  }

  return { api, as, stop, config };
}
