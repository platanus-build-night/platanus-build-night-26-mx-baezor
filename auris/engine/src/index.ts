// MUST be first: loads .env before any module (e.g. ./config) reads process.env.
// ES imports are hoisted, so this side-effect import runs before the imports below.
import "./loadEnv";

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
