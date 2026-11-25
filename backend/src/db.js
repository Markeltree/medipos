import mongoose from "mongoose";

/*
 * One shared MongoDB connection per process. On Vercel each warm function instance
 * reuses it across requests instead of opening a new connection every time.
 */
let connecting = null;

export function connectDb(uri) {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!connecting) {
    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 5 })
      .then(() => mongoose.connection)
      .catch((err) => {
        connecting = null; // let the next request try again
        throw err;
      });
  }
  return connecting;
}
