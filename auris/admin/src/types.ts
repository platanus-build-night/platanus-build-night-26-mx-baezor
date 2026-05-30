// Settings schema — mirrors the engine's settings.json (locked build contract).
// This app is a client of GET/PUT /settings; it never owns generation logic.

export type Tone = "formal" | "casual";
export type Focus = "repaso" | "examen";
export type Level = "principiante" | "avanzado";
export type Duration = "corto" | "medio"; // corto≈2min, medio≈4min

export interface Providers {
  llm: string;
  tts: string;
  storage: string;
}

export interface Settings {
  tone: Tone;
  focus: Focus;
  level: Level;
  duration: Duration;
  quiz: boolean;
  systemPrompt?: string;
  providers: Providers;
}

// Subset of POST /generate 200 envelope used by the optional preview beat.
export interface GenerateResponse {
  script: string;
  audioUrl: string;
  durationSec: number;
  quiz: { question: string; answer: string } | null;
}

// Default mirrors the engine's default settings.json so the screen renders
// fully even before (or without) a successful GET /settings.
export const DEFAULT_SETTINGS: Settings = {
  tone: "casual",
  focus: "repaso",
  level: "principiante",
  duration: "corto",
  quiz: true,
  systemPrompt:
    "Eres un tutor que convierte material de estudio en una lección de audio en español, clara y cercana. Explica el tema con un lenguaje sencillo, da ejemplos concretos y mantén un ritmo cómodo para escuchar mientras la persona viaja. Si el quiz está activado, incluye una pregunta, una pausa breve y luego la respuesta.",
  providers: {
    llm: "claude",
    tts: "elevenlabs",
    storage: "local",
  },
};
