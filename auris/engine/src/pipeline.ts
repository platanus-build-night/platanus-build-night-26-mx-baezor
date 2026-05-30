import { spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { lookupCache } from "./cache";
import { publicBaseUrl } from "./config";
import { AppError } from "./errors";
import {
  getLLMProvider,
  getStorageProvider,
  getTTSProvider,
} from "./providers";
import type { Envelope, GenerationOptions, Quiz, Settings } from "./types";

/** Internal generation budget. HTTP server timeout is 120s; we cut at ~90s. */
const BUDGET_MS = 90_000;

/** Merge order: settings.json (base) <- request options (override). */
export function mergeOptions(
  settings: Settings,
  override?: Partial<GenerationOptions>
): GenerationOptions {
  const base: GenerationOptions = {
    tone: settings.tone,
    focus: settings.focus,
    level: settings.level,
    duration: settings.duration,
    quiz: settings.quiz,
    systemPrompt: settings.systemPrompt,
  };
  if (!override) return base;
  return {
    tone: override.tone ?? base.tone,
    focus: override.focus ?? base.focus,
    level: override.level ?? base.level,
    duration: override.duration ?? base.duration,
    quiz: override.quiz ?? base.quiz,
    systemPrompt:
      override.systemPrompt !== undefined
        ? override.systemPrompt
        : base.systemPrompt,
  };
}

/**
 * Core pipeline:
 *   extractedText -> (cache?) -> LLM.generateScript -> { script, quiz }
 *   -> TTS.synthesize(script) -> Storage.save -> envelope.
 * Wrapped in a ~90s budget; exceeding it emits TIMEOUT.
 */
export async function runPipeline(
  extractedText: string,
  options: GenerationOptions
): Promise<Envelope> {
  return withBudget(BUDGET_MS, () => generate(extractedText, options));
}

async function generate(
  extractedText: string,
  options: GenerationOptions
): Promise<Envelope> {
  // Provider SELECTION authority is the env var (factory reads env), per the
  // contract "Factory reads env -> returns impl". settings.providers is what the
  // admin screen DISPLAYS as the active providers (read-only), not the selector,
  // so a `LLM_PROVIDER=mock` boot truly runs on mocks without API keys.
  const id = crypto.randomUUID();
  const storage = getStorageProvider();

  // Demo cache short-circuit (OFF by default).
  const cached = await lookupCache(extractedText);
  if (cached) {
    const audioUrl = await storage.save(cached.audio, id);
    const durationSec =
      cached.durationSec ?? computeDurationSec(cached.audio, cached.script);
    return {
      script: cached.script,
      audioUrl,
      durationSec,
      quiz: options.quiz ? cached.quiz : null,
    };
  }

  // Real pipeline.
  const llm = getLLMProvider();
  const tts = getTTSProvider();

  const { script, quiz } = await llm.generateScript(extractedText, options);

  // TTS synthesizes ONLY the script (quiz is inline / metadata).
  const audio = await tts.synthesize(script, {
    options,
  });

  const audioUrl = await storage.save(audio, id);
  const durationSec = computeDurationSec(audio, script);

  return {
    script,
    audioUrl,
    durationSec,
    quiz: options.quiz ? quiz : null,
  };
}

/** Build an audioUrl id-aware path (kept for callers/tests). */
export function audioUrlFor(id: string): string {
  return `${publicBaseUrl()}/audio/${id}.mp3`;
}

/**
 * Duration in whole seconds: ffprobe the produced mp3; if ffprobe is absent or
 * fails, estimate from word count (~150 spoken words/min in Spanish).
 */
export function computeDurationSec(audio: Buffer, script: string): number {
  const probed = ffprobeDuration(audio);
  if (probed !== null && probed > 0) return Math.round(probed);
  return estimateFromWords(script);
}

function ffprobeDuration(audio: Buffer): number | null {
  const tmp = path.join(
    os.tmpdir(),
    `auris-probe-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`
  );
  try {
    fs.writeFileSync(tmp, audio);
    const res = spawnSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        tmp,
      ],
      { encoding: "utf8" }
    );
    if (res.status === 0 && res.stdout) {
      const val = parseFloat(res.stdout.trim());
      if (Number.isFinite(val)) return val;
    }
    return null;
  } catch {
    return null;
  } finally {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

function estimateFromWords(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerSecond = 150 / 60; // ~150 wpm
  return Math.max(1, Math.round(words / wordsPerSecond));
}

/** Reject with a TIMEOUT AppError if `task` doesn't settle within `ms`. */
function withBudget<T>(ms: number, task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(
        new AppError(
          "TIMEOUT",
          `Generation exceeded the ${Math.round(ms / 1000)}s internal budget.`
        )
      );
    }, ms);

    task().then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export type { Quiz };
