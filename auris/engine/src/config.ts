import path from "path";

function str(name: string, fallback: string): string {
  const v = process.env[name];
  return v !== undefined && v !== "" ? v : fallback;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v !== undefined && v !== "" ? v : undefined;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

const ENGINE_PORT = int("ENGINE_PORT", 3000);
const AUDIO_DIR = path.resolve(str("AUDIO_DIR", "./audio"));

export const config = {
  ENGINE_PORT,
  ADMIN_ORIGIN: str("ADMIN_ORIGIN", "http://localhost:5173"),

  // Provider selection (factory reads these).
  LLM_PROVIDER: str("LLM_PROVIDER", "claude"),
  TTS_PROVIDER: str("TTS_PROVIDER", "elevenlabs"),
  STORAGE_PROVIDER: str("STORAGE_PROVIDER", "local"),

  // Anthropic (LLM).
  ANTHROPIC_API_KEY: optional("ANTHROPIC_API_KEY"),
  ANTHROPIC_MODEL: str("ANTHROPIC_MODEL", "claude-sonnet-4-6"),

  // ElevenLabs (TTS).
  ELEVENLABS_API_KEY: optional("ELEVENLABS_API_KEY"),
  ELEVENLABS_VOICE_ID: optional("ELEVENLABS_VOICE_ID"),
  ELEVENLABS_MODEL: str("ELEVENLABS_MODEL", "eleven_multilingual_v2"),

  // Storage.
  AUDIO_DIR,

  // Demo cache (empty = disabled).
  DEMO_CACHE_DIR: optional("DEMO_CACHE_DIR"),

  // Caps.
  MAX_UPLOAD_MB: int("MAX_UPLOAD_MB", 10),
  INPUT_CHAR_CAP: int("INPUT_CHAR_CAP", 6000),
} as const;

/** Public base URL used to build serveable audio URLs. */
export function publicBaseUrl(): string {
  return `http://localhost:${config.ENGINE_PORT}`;
}

export type Config = typeof config;
