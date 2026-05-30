import dotenv from "dotenv";
import path from "path";

// Load env from the repo root .env (engine runs from engine/). Falls back to
// real defaults in config.ts if absent, so boot never depends on .env existing.
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });
// Also pick up a local engine/.env if present (does not override already-set vars).
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { createApp } from "./app";
import { config } from "./config";
import { loadSettings } from "./settings";

function main() {
  // Touch settings at startup so an obviously broken settings.json surfaces early.
  const settings = loadSettings();

  const app = createApp();
  const server = app.listen(config.ENGINE_PORT, () => {
    console.log(
      `[auris-engine] listening on http://localhost:${config.ENGINE_PORT}`
    );
    // Active provider SELECTION comes from env (factory reads env); settings.providers
    // is only what the admin screen displays.
    console.log(
      `[auris-engine] providers (env): llm=${config.LLM_PROVIDER} tts=${config.TTS_PROVIDER} storage=${config.STORAGE_PROVIDER}`
    );
    console.log(`[auris-engine] audio dir: ${config.AUDIO_DIR}`);
    console.log(`[auris-engine] admin origin (CORS): ${config.ADMIN_ORIGIN}`);
  });

  // HTTP server timeout 120s (internal pipeline budget is ~90s).
  server.setTimeout(120_000);
}

main();
