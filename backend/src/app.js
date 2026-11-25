import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { apiRouter } from "./routes/api.js";

export function createApp(config) {
  const app = express();
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", config.trustProxy);

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  if (config.logRequests) app.use(morgan("dev"));

  app.use("/api", apiRouter(config));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
