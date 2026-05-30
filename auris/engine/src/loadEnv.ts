import dotenv from "dotenv";
import path from "path";

/**
 * Loads .env BEFORE any module that reads process.env at import time.
 *
 * config.ts snapshots env into a frozen `config` object on first import. ES
 * module imports are hoisted and evaluated before the importing module's body,
 * so calling dotenv.config() inline in index.ts ran it AFTER ./config had
 * already been evaluated — leaving ANTHROPIC_API_KEY / ELEVENLABS_* empty and
 * breaking the real providers (mock needs no keys, so tests missed it).
 *
 * Importing this side-effect module FIRST in the entry point guarantees env is
 * populated before ./config evaluates. It must only import dotenv/path so
 * nothing in its graph reads config before env is loaded.
 *
 * engine runs from engine/; the repo .env lives at the auris/ root (two levels
 * up from src/). An optional engine/.env is also picked up. dotenv does not
 * override already-set vars, so process/shell env still wins.
 */
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
