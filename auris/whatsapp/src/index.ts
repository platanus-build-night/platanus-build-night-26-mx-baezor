/**
 * Auris — WhatsApp client (demo channel).
 *
 * HARD RULES (from the LOCKED BUILD CONTRACT):
 *   - Zero generation logic lives here. No prompt assembly, no LLM/TTS calls.
 *   - NO import from ../engine.
 *   - Talks to the engine ONLY over http://localhost:<ENGINE_PORT> via HTTP.
 *
 * Flow:
 *   message in  -> ack "Generando tu audio..." -> POST /generate (no options,
 *   so the engine uses active settings.json) -> fetch envelope.audioUrl bytes
 *   -> reply with the MP3 as a VOICE NOTE that plays inline.
 *
 * Every branch of the message handler terminates in a reply — the user is
 * never left in silence.
 */

import * as dotenv from "dotenv";
import qrcode from "qrcode-terminal";
import wweb from "whatsapp-web.js";

import { ACK, GENERIC_FALLBACK, copyForErrorCode } from "./messages";

dotenv.config();

const { Client, LocalAuth, MessageMedia } = wweb;
type Message = wweb.Message;

// ─── Config ────────────────────────────────────────────────────────────────
// ENGINE_URL wins if set; otherwise build from ENGINE_PORT; default :3000.
const ENGINE_URL = (
  process.env.ENGINE_URL ??
  `http://localhost:${process.env.ENGINE_PORT ?? "3000"}`
).replace(/\/+$/, "");

const PDF_MIME = "application/pdf";

/** The engine's 200 envelope (EXACT field names per contract). */
interface GenerateEnvelope {
  script: string;
  audioUrl: string;
  durationSec: number;
  quiz: { question: string; answer: string } | null;
}

/** The engine's error shape: { error: { code, message } }. */
interface EngineErrorBody {
  error?: { code?: string; message?: string };
}

// ─── Engine calls ────────────────────────────────────────────────────────────

/**
 * Thrown when the engine returns a non-2xx with a recognizable error body.
 * `code` is mapped to Spanish copy by the caller.
 */
class EngineError extends Error {
  constructor(
    public readonly code: string | undefined,
    devDetail: string,
  ) {
    super(devDetail);
    this.name = "EngineError";
  }
}

/** Parse a /generate Response into the envelope, or throw EngineError. */
async function parseGenerateResponse(res: Response): Promise<GenerateEnvelope> {
  if (res.ok) {
    return (await res.json()) as GenerateEnvelope;
  }
  // Try to surface the engine's machine code; tolerate non-JSON error bodies.
  let code: string | undefined;
  let detail = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as EngineErrorBody;
    code = body?.error?.code;
    detail = body?.error?.message ?? detail;
  } catch {
    /* non-JSON error body — fall through to generic copy */
  }
  throw new EngineError(code, detail);
}

/** POST a PDF to /generate as multipart/form-data. No options sent. */
async function generateFromPdf(
  buffer: Buffer,
  filename: string,
  mimetype: string,
): Promise<GenerateEnvelope> {
  // Node 24 native FormData + Blob — undici computes the multipart boundary &
  // content-length correctly. (The `form-data` npm package does NOT work as a
  // global-fetch body.) Do NOT set Content-Type manually.
  const form = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: mimetype });
  form.append("file", blob, filename);

  const res = await fetch(`${ENGINE_URL}/generate`, {
    method: "POST",
    body: form,
  });
  return parseGenerateResponse(res);
}

/** POST plain text to /generate as application/json. No options sent. */
async function generateFromText(text: string): Promise<GenerateEnvelope> {
  const res = await fetch(`${ENGINE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return parseGenerateResponse(res);
}

/** Fetch the generated MP3 bytes from the engine-provided absolute audioUrl. */
async function fetchAudio(audioUrl: string): Promise<Buffer> {
  const res = await fetch(audioUrl);
  if (!res.ok) {
    throw new EngineError(undefined, `audio fetch failed: HTTP ${res.status}`);
  }
  const bytes = await res.arrayBuffer();
  return Buffer.from(bytes);
}

// ─── Reply helper ────────────────────────────────────────────────────────────

/** Send the MP3 back as an inline voice note. */
async function replyWithVoiceNote(
  msg: Message,
  audio: Buffer,
): Promise<void> {
  const media = new MessageMedia("audio/mpeg", audio.toString("base64"));
  await msg.reply(media, undefined, { sendAudioAsVoice: true });
}

// ─── Message handler ─────────────────────────────────────────────────────────

/**
 * Handle one inbound message. Guaranteed to terminate in a reply on every
 * non-ignored path. Errors are mapped to Spanish copy; anything unexpected
 * falls back to the generic message.
 */
async function handleMessage(msg: Message): Promise<void> {
  // ── Guards: ignore our own messages, status broadcasts, empty noise. ──
  if (msg.fromMe) return;
  if (msg.from === "status@broadcast") return;

  const body = (msg.body ?? "").trim();

  // Decide the input mode up front so we can ack, then branch.
  const hasPdf = msg.hasMedia;
  const hasText = body.length > 0;

  if (!hasPdf && !hasText) {
    // Nothing actionable (e.g. a reaction or empty event) — stay quiet.
    return;
  }

  try {
    // Acknowledge immediately so the user knows we're working.
    await msg.reply(ACK);

    let envelope: GenerateEnvelope;

    if (hasPdf) {
      const media = await msg.downloadMedia();
      if (!media || !media.data) {
        await msg.reply(copyForErrorCode("EXTRACTION_FAILED"));
        return;
      }

      // OCR / non-PDF media is an anti-requirement: do not forward images.
      if (media.mimetype !== PDF_MIME) {
        await msg.reply(copyForErrorCode("UNSUPPORTED_FILE"));
        return;
      }

      const buffer = Buffer.from(media.data, "base64");
      const filename = media.filename ?? "document.pdf";
      envelope = await generateFromPdf(buffer, filename, media.mimetype);
    } else {
      // Plain text — turn the message body into an audio study session.
      envelope = await generateFromText(body);
    }

    if (!envelope?.audioUrl) {
      // Malformed success body — never silence.
      await msg.reply(GENERIC_FALLBACK);
      return;
    }

    const audio = await fetchAudio(envelope.audioUrl);
    await replyWithVoiceNote(msg, audio);
  } catch (err) {
    // Mapped engine error -> Spanish copy; everything else -> generic.
    const code = err instanceof EngineError ? err.code : undefined;
    console.error(
      "[auris-whatsapp] generation failed:",
      err instanceof Error ? err.message : err,
    );
    try {
      await msg.reply(copyForErrorCode(code));
    } catch (replyErr) {
      // If even the error reply fails, log it — but we tried, no silent drop.
      console.error("[auris-whatsapp] failed to send error reply:", replyErr);
    }
  }
}

// ─── Client wiring ───────────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth(), // persists session under .wwebjs_auth/
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr: string) => {
  console.log("[auris-whatsapp] Scan this QR code with WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("[auris-whatsapp] Authenticated. Session persisted.");
});

client.on("auth_failure", (message: string) => {
  console.error("[auris-whatsapp] Authentication failure:", message);
});

client.on("ready", () => {
  console.log("=================================================");
  console.log(" WhatsApp client ready");
  console.log(` Engine: ${ENGINE_URL}`);
  console.log("=================================================");
});

client.on("disconnected", (reason: string) => {
  console.warn("[auris-whatsapp] Disconnected:", reason);
});

client.on("message", (msg: Message) => {
  // Never let a handler rejection take down the process.
  void handleMessage(msg).catch((err) => {
    console.error("[auris-whatsapp] unhandled handler error:", err);
  });
});

console.log("[auris-whatsapp] Starting client...");
client.initialize();
