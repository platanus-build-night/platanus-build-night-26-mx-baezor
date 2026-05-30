import fs from "fs";
import path from "path";
import type { ProvidersSetting, Settings } from "./types";

const SETTINGS_PATH = path.resolve(__dirname, "..", "settings.json");

const DEFAULT_SETTINGS: Settings = {
  tone: "casual",
  focus: "repaso",
  level: "principiante",
  duration: "corto",
  quiz: true,
  systemPrompt:
    "Eres Auris, un tutor de audio en español que convierte material de estudio en una sesión de estudio hablada, cálida y cercana.",
  providers: { llm: "claude", tts: "elevenlabs", storage: "local" },
};

/** Load settings.json from disk, falling back to defaults on any read error. */
export function loadSettings(): Settings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      providers: {
        ...DEFAULT_SETTINGS.providers,
        ...(parsed.providers ?? {}),
      },
    };
  } catch {
    return { ...DEFAULT_SETTINGS, providers: { ...DEFAULT_SETTINGS.providers } };
  }
}

/** Persist settings.json (pretty-printed). */
export function saveSettings(settings: Settings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n", "utf8");
}

/**
 * Deep-merge an incoming partial patch onto the current settings, persist, and
 * return the updated settings. The nested `providers` object merges (it is not
 * clobbered by a shallow spread).
 */
export function updateSettings(patch: Partial<Settings>): Settings {
  const current = loadSettings();
  const mergedProviders: ProvidersSetting = {
    ...current.providers,
    ...(patch.providers ?? {}),
  };
  const next: Settings = {
    ...current,
    ...patch,
    providers: mergedProviders,
  };
  saveSettings(next);
  return next;
}
