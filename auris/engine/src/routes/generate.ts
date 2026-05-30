import { Router } from "express";
import multer from "multer";
import { config } from "../config";
import { extractFromFile, extractFromText } from "../extract";
import { AppError } from "../errors";
import { mergeOptions, runPipeline } from "../pipeline";
import { loadSettings } from "../settings";
import type { GenerationOptions } from "../types";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 },
});

export const generateRouter = Router();

/**
 * POST /generate — two input modes by Content-Type:
 *   application/json     -> { text, options? }
 *   multipart/form-data  -> part "file" (PDF) + optional "options" (JSON string)
 * Merge order: settings.json (base) <- request options (override).
 * The WhatsApp client sends NO options -> active settings are used.
 */
generateRouter.post(
  "/",
  (req, res, next) => {
    const contentType = req.headers["content-type"] ?? "";
    if (contentType.includes("multipart/form-data")) {
      upload.single("file")(req, res, (err: unknown) => {
        if (err) {
          if (
            err instanceof multer.MulterError &&
            err.code === "LIMIT_FILE_SIZE"
          ) {
            return next(
              new AppError(
                "UNSUPPORTED_FILE",
                `File exceeds the ${config.MAX_UPLOAD_MB} MB limit.`
              )
            );
          }
          return next(err);
        }
        next();
      });
      return;
    }
    next();
  },
  async (req, res, next) => {
    try {
      const settings = loadSettings();
      const contentType = req.headers["content-type"] ?? "";

      let extractedText: string;
      let override: Partial<GenerationOptions> | undefined;

      if (contentType.includes("multipart/form-data")) {
        const file = req.file;
        if (!file) {
          throw new AppError(
            "UNSUPPORTED_FILE",
            "No file part provided in multipart/form-data request."
          );
        }
        override = parseOptionsString(req.body?.options);
        extractedText = await extractFromFile(
          file.buffer,
          file.mimetype,
          file.originalname
        );
      } else {
        const body = (req.body ?? {}) as {
          text?: unknown;
          options?: Partial<GenerationOptions>;
        };
        if (typeof body.text !== "string" || body.text.trim().length === 0) {
          throw new AppError(
            "UNSUPPORTED_FILE",
            "JSON body must include a non-empty 'text' field."
          );
        }
        override = body.options;
        extractedText = extractFromText(body.text);
      }

      const options = mergeOptions(settings, override);
      const envelope = await runPipeline(extractedText, options);
      res.status(200).json(envelope);
    } catch (err) {
      next(err);
    }
  }
);

function parseOptionsString(
  raw: unknown
): Partial<GenerationOptions> | undefined {
  if (typeof raw !== "string" || raw.trim().length === 0) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Partial<GenerationOptions>)
      : undefined;
  } catch {
    // Malformed options JSON is ignored -> fall back to active settings.
    return undefined;
  }
}
