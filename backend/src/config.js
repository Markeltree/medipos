/** Reads and checks settings from environment variables. Throws on anything missing or unsafe. */
export function loadConfig(env = process.env) {
  const mongoUri = env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }

  return {
    port: Number(env.PORT) || 4000,
    mongoUri,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || "12h",
    corsOrigins: (env.CORS_ORIGIN || "http://localhost:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    // Number of reverse proxies in front of the app (1 on Render/Railway), so rate limits see the real client IP.
    trustProxy: Number(env.TRUST_PROXY) || 0,
    allowDemoReset: env.ALLOW_DEMO_RESET === "true",
    logRequests: env.NODE_ENV !== "test",
  };
}
