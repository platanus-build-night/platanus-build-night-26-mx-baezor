/**
 * Auris MCP — thin HTTP client for the engine.
 *
 * HARD RULES (mirror the WhatsApp client):
 *   - Zero generation logic lives here. No prompt assembly, no LLM/TTS calls.
 *   - NO import from ../engine — the contract types are copied locally below.
 *   - Talks to the engine ONLY over http://localhost:<ENGINE_PORT> via HTTP
 *     (native fetch, undici under Node 24).
 */

import * as dotenv from "dotenv";

import type { GenerateEnvelope } from "./map.js";

// Load the module-local .env. quiet:true keeps dotenv OFF stdout — under stdio
// transport, stdout IS the JSON-RPC channel and any stray line corrupts it.
dotenv.config({ quiet: true });

// ENGINE_URL wins if set; otherwise build from ENGINE_PORT; default :3000.
// (Mirrors auris/whatsapp/src/index.ts exactly.)
const ENGINE_URL = (
  process.env.ENGINE_URL ??
  `http://localhost:${process.env.ENGINE_PORT ?? "3000"}`
).replace(/\/+$/, "");

/** The engine's error shape: { error: { code, message } }. */
interface EngineErrorBody {
  error?: { code?: string; message?: string };
}

/** Only the override fields the generate tool forwards (omit-if-undefined). */
export interface GenerateOptions {
  tone?: "formal" | "casual";
  focus?: "repaso" | "examen";
  level?: "principiante" | "avanzado";
  duration?: "corto" | "medio";
  quiz?: boolean;
}

/**
 * Thrown when the engine returns a non-2xx with a recognizable error body.
 * `code` is the engine's machine code; index.ts maps it via engineErrorToResult.
 */
export class EngineError extends Error {
  constructor(
    public readonly code: string | undefined,
    devDetail: string,
  ) {
    super(devDetail);
    this.name = "EngineError";
  }
}

/** Parse a Response into the envelope, or throw EngineError on non-2xx. */
async function parseGenerateResponse(res: Response): Promise<GenerateEnvelope> {
  if (res.ok) {
    return (await res.json()) as GenerateEnvelope;
  }
  // Surface the engine's machine code; tolerate non-JSON error bodies.
  let code: string | undefined;
  let detail = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as EngineErrorBody;
    code = body?.error?.code;
    detail = body?.error?.message ?? detail;
  } catch {
    /* non-JSON error body — fall through to generic detail */
  }
  throw new EngineError(code, detail);
}

/**
 * POST plain text to /generate as application/json. Body is { text, options }
 * where `options` carries ONLY the override fields actually provided.
 */
export async function generate(
  text: string,
  options: GenerateOptions,
): Promise<GenerateEnvelope> {
  // Strip undefined so we never override an engine default with `undefined`.
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(options)) {
    if (v !== undefined) cleaned[k] = v;
  }

  const body: Record<string, unknown> = { text };
  if (Object.keys(cleaned).length > 0) body.options = cleaned;

  const res = await fetch(`${ENGINE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseGenerateResponse(res);
}

/** GET /settings — returns the current settings JSON (unknown shape, opaque). */
export async function getSettings(): Promise<unknown> {
  const res = await fetch(`${ENGINE_URL}/settings`, { method: "GET" });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const errBody = (await res.json()) as EngineErrorBody;
      code = errBody?.error?.code;
      detail = errBody?.error?.message ?? detail;
    } catch {
      /* non-JSON error body — keep the HTTP-status detail */
    }
    throw new EngineError(code, detail);
  }
  return res.json();
}

/** The resolved engine base URL — exported for diagnostics/logging only. */
export const engineUrl = ENGINE_URL;
