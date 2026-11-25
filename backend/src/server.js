import mongoose from "mongoose";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { connectDb } from "./db.js";

const config = loadConfig();

await connectDb(config.mongoUri);
console.log(`Connected to MongoDB database "${mongoose.connection.name}"`);

const server = createApp(config).listen(config.port, () => {
  console.log(`MediPOS API listening on http://localhost:${config.port}/api`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
