import { Router } from "express";
import { loadSettings, updateSettings } from "../settings";
import type { Settings } from "../types";

export const settingsRouter = Router();

/** GET /settings -> current settings.json. */
settingsRouter.get("/", (_req, res) => {
  res.status(200).json(loadSettings());
});

/** PUT /settings -> deep-merge + persist + return updated settings. */
settingsRouter.put("/", (req, res) => {
  const patch = (req.body ?? {}) as Partial<Settings>;
  const updated = updateSettings(patch);
  res.status(200).json(updated);
});
