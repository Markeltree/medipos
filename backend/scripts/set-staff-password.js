/*
 * Sets staff login passwords without touching any other data.
 *   npm run set-password                         every staff account gets SEED_STAFF_PASSWORD
 *   npm run set-password -- someone@medipos.pk   only that account
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Staff } from "../src/models/index.js";

const uri = process.env.MONGODB_URI;
const password = process.env.SEED_STAFF_PASSWORD;
const email = process.argv[2]?.toLowerCase();

if (!uri) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Set SEED_STAFF_PASSWORD in .env (at least 8 characters).");
  process.exit(1);
}

await mongoose.connect(uri);
try {
  const filter = email ? { email } : {};
  const passwordHash = await bcrypt.hash(password, 10);
  const { matchedCount } = await Staff.updateMany(filter, { $set: { passwordHash } });
  if (matchedCount === 0) {
    console.error(email ? `No staff account with email ${email}` : "No staff accounts found. Run npm run seed first.");
    process.exitCode = 1;
  } else {
    console.log(`Password updated for ${matchedCount} staff account(s) in database "${mongoose.connection.name}".`);
  }
} finally {
  await mongoose.disconnect();
}
