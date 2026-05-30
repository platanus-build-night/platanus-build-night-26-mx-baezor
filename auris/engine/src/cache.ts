import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { config } from "./config";
import type { Quiz } from "./types";

/**
 * DEMO_CACHE_DIR fallback — OFF by default. When DEMO_CACHE_DIR is set AND both
 * `<sha256(extractedText)>.mp3` and `.json` exist there, the pipeline short-
 * circuits and returns them (a latency dodge for the live stage demo). Default
 * off, so the submitted "verifiable evidence" API always runs the real pipeline.
 */

export interface CacheHit {
  audio: Buffer;
  script: string;
  quiz: Quiz | null;
  durationSec?: number;
}

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

export function cacheEnabled(): boolean {
  return Boolean(config.DEMO_CACHE_DIR);
}

/** Returns a cached result if enabled and present, else null. */
export async function lookupCache(extractedText: string): Promise<CacheHit | null> {
  if (!config.DEMO_CACHE_DIR) return null;

  const dir = config.DEMO_CACHE_DIR;
  const hash = sha256(extractedText);
  const mp3Path = path.join(dir, `${hash}.mp3`);
  const jsonPath = path.join(dir, `${hash}.json`);

  try {
    const [audio, metaRaw] = await Promise.all([
      fs.readFile(mp3Path),
      fs.readFile(jsonPath, "utf8"),
    ]);
    const meta = JSON.parse(metaRaw) as {
      script?: string;
      quiz?: Quiz | null;
      durationSec?: number;
    };
    if (typeof meta.script !== "string") return null;
    return {
      audio,
      script: meta.script,
      quiz: meta.quiz ?? null,
      durationSec: meta.durationSec,
    };
  } catch {
    // Any missing file or parse error -> treat as a cache miss.
    return null;
  }
}
