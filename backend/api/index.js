/*
 * Vercel entry point. vercel.json rewrites every path to this function; Express
 * then routes on the original URL (/api/health, /api/sales, ...).
 * Locally, src/server.js is used instead.
 */
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { connectDb } from "../src/db.js";

const config = loadConfig();
const app = createApp(config);

export default async function handler(req, res) {
  try {
    await connectDb(config.mongoUri);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Database is unavailable. Try again shortly." }));
    return;
  }
  return app(req, res);
}
