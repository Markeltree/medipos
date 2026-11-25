/*
 * Loads the demo data into the database in MONGODB_URI.
 *   npm run seed -- --force
 * Wipes existing MediPOS collections first, so it refuses to run without --force
 * when the database already has data. Staff log in with SEED_STAFF_PASSWORD.
 */
import mongoose from "mongoose";
import { Medicine, Staff } from "../models/index.js";
import { seedBusinessData, seedStaff } from "./seed.js";

const uri = process.env.MONGODB_URI;
const password = process.env.SEED_STAFF_PASSWORD;
const force = process.argv.includes("--force");

if (!uri) {
  console.error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Set SEED_STAFF_PASSWORD (at least 8 characters) in .env. Every demo staff account gets this password.");
  process.exit(1);
}

await mongoose.connect(uri);
try {
  const existing = (await Medicine.estimatedDocumentCount()) + (await Staff.estimatedDocumentCount());
  if (existing > 0 && !force) {
    console.error(`Database "${mongoose.connection.name}" already has data. Re-run with --force to wipe and reseed it.`);
    process.exitCode = 1;
  } else {
    await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).createIndexes()));
    const { sales } = await seedBusinessData();
    const staff = await seedStaff(password);
    console.log(`Seeded database "${mongoose.connection.name}" with ${sales} sales and ${staff.length} staff.`);
    console.log("Staff logins (password = SEED_STAFF_PASSWORD):");
    for (const s of staff) console.log(`  ${s.email.padEnd(30)} ${s.role.padEnd(18)} ${s.status}`);
  }
} finally {
  await mongoose.disconnect();
}
