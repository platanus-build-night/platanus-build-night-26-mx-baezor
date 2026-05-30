import { Router } from "express";
import fs from "fs";
import path from "path";
import { config } from "../config";

export const audioRouter = Router();

/**
 * GET /audio/:id -> audio/mpeg.
 * The stored URL is .../audio/<id>.mp3, so :id already carries the ".mp3"
 * extension — do NOT re-append it. Serve <AUDIO_DIR>/<id> directly.
 * Files are ephemeral (wiped on restart; no cleanup logic in v1).
 */
audioRouter.get("/:id", (req, res) => {
  const id = req.params.id;

  // Guard against path traversal; the id is a flat filename.
  if (id.includes("/") || id.includes("\\") || id.includes("..")) {
    res.status(400).json({
      error: { code: "UNSUPPORTED_FILE", message: "Invalid audio id." },
    });
    return;
  }

  const filePath = path.join(config.AUDIO_DIR, id);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({
      error: { code: "EXTRACTION_FAILED", message: "Audio not found." },
    });
    return;
  }

  res.setHeader("Content-Type", "audio/mpeg");
  fs.createReadStream(filePath).pipe(res);
});
