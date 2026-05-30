// ─── Generation options & settings ────────────────────────────────────────

export type Tone = "formal" | "casual";
export type Focus = "repaso" | "examen";
export type Level = "principiante" | "avanzado";
export type Duration = "corto" | "medio"; // corto≈2min/~300w (default), medio≈4min/~600w

export interface GenerationOptions {
  tone: Tone;
  focus: Focus;
  level: Level;
  duration: Duration;
  quiz: boolean;
  /** "Avanzado" raw override; the engine STILL assembles the final prompt around it. */
  systemPrompt?: string;
}

export interface ProvidersSetting {
  llm: string;
  tts: string;
  storage: string;
}

/** The full persisted settings.json (global, single instance). */
export interface Settings extends GenerationOptions {
  providers: ProvidersSetting;
}

// ─── Quiz & response envelope ──────────────────────────────────────────────

export interface Quiz {
  question: string;
  answer: string;
}

/** EXACT 200 shape for POST /generate — do not rename fields. */
export interface Envelope {
  script: string;
  audioUrl: string;
  durationSec: number;
  quiz: Quiz | null;
}

// ─── Provider interfaces (the open-source value prop) ──────────────────────

export interface VoiceOptions {
  /** Provider voice id (e.g. ELEVENLABS_VOICE_ID). */
  voiceId?: string;
  /** Provider model id (e.g. ELEVENLABS_MODEL). */
  model?: string;
  /** Carried through for providers that tune delivery by these. */
  options?: GenerationOptions;
}

export interface LLMProvider {
  generateScript(
    text: string,
    options: GenerationOptions
  ): Promise<{ script: string; quiz: Quiz | null }>;
}

export interface TTSProvider {
  /** Synthesizes ONLY the script (quiz is inline; never synthesized separately). Returns MP3 bytes. */
  synthesize(script: string, options: VoiceOptions): Promise<Buffer>;
}

export interface StorageProvider {
  /** Persists the audio under `id` and returns a serveable URL. */
  save(audio: Buffer, id: string): Promise<string>;
}

// ─── Error codes (machine codes; whatsapp owns Spanish copy) ───────────────

export type ErrorCode =
  | "UNSUPPORTED_FILE"
  | "EXTRACTION_FAILED"
  | "PROVIDER_FAILED"
  | "TIMEOUT";
