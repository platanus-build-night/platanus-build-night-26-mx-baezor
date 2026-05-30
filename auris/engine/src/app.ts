import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { config } from "./config";
import { errorBody, isAppError } from "./errors";
import { audioRouter } from "./routes/audio";
import { generateRouter } from "./routes/generate";
import { settingsRouter } from "./routes/settings";

/** Build the Express app with CORS, routes, and the contract error handler. */
export function createApp() {
  const app = express();

  // CORS for the admin app origin. No /admin is served by the engine.
  app.use(cors({ origin: config.ADMIN_ORIGIN }));

  // JSON body parsing for the application/json mode of /generate and /settings.
  // multipart is handled per-route by multer; express.json() ignores it.
  app.use(express.json({ limit: `${config.MAX_UPLOAD_MB}mb` }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/generate", generateRouter);
  app.use("/settings", settingsRouter);
  app.use("/audio", audioRouter);

  // Contract error handler: EXACT shape { error: { code, message } }.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (isAppError(err)) {
      res.status(err.status).json(errorBody(err.code, err.message));
      return;
    }
    const message = err instanceof Error ? err.message : "Unexpected error.";
    // Unknown failures map to PROVIDER_FAILED (502) — the engine never silently
    // 500s; the whatsapp catch-all owns the Spanish copy for unknown codes.
    res.status(502).json(errorBody("PROVIDER_FAILED", message));
  });

  return app;
}
