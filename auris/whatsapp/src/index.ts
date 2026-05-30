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

import { ACK, GENERIC_FALLBACK, copyForErrorCode, isBotCopy } from "./messages";
import { startQrServer } from "./qrWeb";

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

// Demo-only: serve the pairing QR as a scannable image at http://localhost:<QR_PORT>.
const QR_PORT = Number(process.env.QR_PORT ?? "4000");
const qrServer = startQrServer(QR_PORT);

// Demo: only react to YOUR OWN self-chat ("Message Yourself"); ignore messages
// from other people so the bot never replies to your real contacts. Set
// SELF_CHAT_ONLY=false to restore the production flow (receive material from others).
const SELF_CHAT_ONLY =
  (process.env.SELF_CHAT_ONLY ?? "true").toLowerCase() !== "false";

// Optional explicit self-chat id (e.g. "<lid>@lid" or "<num>@c.us") — a guaranteed
// match for the demo when auto-detecting the @lid self-chat is unreliable. Read the
// value from the client's startup log ("Linked as: … lid=…") or the resolve dbg line.
const SELF_CHAT_LID = process.env.SELF_CHAT_LID?.trim() || undefined;

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
 * Process one inbound request (incoming from another chat, or a self-chat demo
 * message). Routing/loop-prevention happens in the listeners below; by the time
 * we get here the message is a real request. Guaranteed to terminate in a reply
 * on every actionable path; errors map to Spanish copy.
 */
async function handleMessage(msg: Message): Promise<void> {
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

// ─── Routing helpers ─────────────────────────────────────────────────────────

// The linked account's own ids (set on ready). WhatsApp uses two addressing
// schemes: the phone-number "@c.us" wid and an opaque "@lid". The self-chat
// ("Message Yourself") shows up under the @lid, so we match by resolved phone
// NUMBER rather than by a single id string.
let ownId: string | undefined; // e.g. 5219983465191@c.us
let myNumber: string | undefined; // e.g. 5219983465191
let myLid: string | undefined; // e.g. 171318309859490@lid (self-chat is addressed by lid)

/** True if this fromMe message is one of OUR replies (ack/error text or a voice note). */
function isOwnReply(msg: Message): boolean {
  if (msg.type === "audio" || msg.type === "ptt") return true; // voice notes we send
  return isBotCopy(msg.body);
}

/** Pull a "@lid" serialized id out of a contact's various shapes. */
function lidFromContact(c: unknown): string | undefined {
  const a = c as { lid?: { _serialized?: string } | string; _data?: { lid?: { _serialized?: string } | string } };
  const cand =
    (typeof a?.lid === "object" ? a.lid?._serialized : a?.lid) ??
    (typeof a?._data?.lid === "object" ? a._data?.lid?._serialized : a?._data?.lid);
  return typeof cand === "string" ? cand : undefined;
}

/** Pull a real phone number (digits) out of a contact's raw data (lid contacts hide it in _data). */
function phoneFromContact(c: unknown): string | undefined {
  const a = c as { number?: string; _data?: Record<string, unknown> };
  const d = a?._data ?? {};
  for (const v of [d.pn, d.phoneNumber, d.phone, a?.number]) {
    if (typeof v === "string" && !v.includes("@lid")) {
      const digits = v.replace(/\D/g, "");
      if (digits) return digits;
    }
  }
  return undefined;
}

/** Resolve and cache our own @lid so we can recognize the self-chat (best-effort). */
async function resolveMyLid(): Promise<void> {
  if (!ownId) return;
  try {
    const me = await client.getContactById(ownId);
    myLid = lidFromContact(me);
  } catch {
    /* best-effort; SELF_CHAT_LID is the reliable override when this can't resolve */
  }
}

/**
 * True if `msg` belongs to the user's own self-chat. WhatsApp addresses the
 * self-chat by an opaque "@lid"; match it by our own lid OR by a real phone
 * number dug out of the contact's raw data (both cross-check the same account).
 */
async function isSelfChat(msg: Message): Promise<boolean> {
  const chat = await msg.getChat();
  const id = chat.id._serialized;
  if (SELF_CHAT_LID && id === SELF_CHAT_LID) return true; // explicit override (demo)
  if (ownId && id === ownId) return true; // @c.us self-chat
  if (myLid && id === myLid) return true; // @lid self-chat (cached)
  if (chat.isGroup) return false;
  try {
    const contact = await client.getContactById(id);
    const lid = lidFromContact(contact);
    const phone = phoneFromContact(contact);
    if (lid && myLid && lid === myLid) return true;
    return !!phone && !!myNumber && phone === myNumber;
  } catch {
    return false;
  }
}

// ─── Client wiring ───────────────────────────────────────────────────────────

// Optional WhatsApp Web version pin. Left unset by default (the built-in version
// reaches "ready" cleanly here); set WA_WEB_VERSION to pin a known-good build from
// github.com/wppconnect-team/wa-version if WhatsApp ships a breaking update.
const WA_WEB_VERSION = process.env.WA_WEB_VERSION;

const client = new Client({
  authStrategy: new LocalAuth(), // persists session under .wwebjs_auth/
  ...(WA_WEB_VERSION
    ? {
        webVersionCache: {
          type: "remote" as const,
          remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${WA_WEB_VERSION}.html`,
        },
      }
    : {}),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr: string) => {
  qrServer.setQr(qr);
  console.log(`[auris-whatsapp] Scan the QR at ${qrServer.url} (or the terminal):`);
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  qrServer.setStatus("authenticated");
  console.log("[auris-whatsapp] Authenticated. Session persisted.");
});

client.on("auth_failure", (message: string) => {
  console.error("[auris-whatsapp] Authentication failure:", message);
});

client.on("ready", async () => {
  qrServer.setStatus("ready");
  ownId = client.info?.wid?._serialized;
  myNumber = client.info?.wid?.user;
  await resolveMyLid();
  console.log("=================================================");
  console.log(" WhatsApp client ready");
  console.log(` Engine: ${ENGINE_URL}`);
  console.log(` QR page: ${qrServer.url}`);
  console.log(` Linked as: ${ownId ?? "unknown"} (number=${myNumber ?? "?"}, lid=${myLid ?? "?"})`);
  console.log(` Mode: ${SELF_CHAT_ONLY ? "SELF-CHAT ONLY (chat yourself)" : "all chats"}`);
  console.log("=================================================");
});

client.on("disconnected", (reason: string) => {
  qrServer.setStatus("disconnected");
  console.warn("[auris-whatsapp] Disconnected:", reason);
});

// Incoming messages from OTHER chats (the production flow: someone sends material).
// Disabled by default for the demo (SELF_CHAT_ONLY) so the bot stays silent to
// your real contacts.
client.on("message", (msg: Message) => {
  if (SELF_CHAT_ONLY) return;
  if (msg.fromMe) return; // self-chat handled by message_create below
  void handleMessage(msg).catch((err) => {
    console.error("[auris-whatsapp] unhandled handler error:", err);
  });
});

// fromMe messages — only the SELF-CHAT ("Message Yourself") is a demo input.
// Skip our own replies (so we never loop) and ignore normal outgoing messages
// to other people.
client.on("message_create", (msg: Message) => {
  if (!msg.fromMe) return; // incoming handled by the "message" listener above
  if (isOwnReply(msg)) return; // our ack / error text / voice note
  void (async () => {
    if (!(await isSelfChat(msg))) return; // only the self-chat is a demo input
    await handleMessage(msg);
  })().catch((err) => {
    console.error("[auris-whatsapp] self-chat handler error:", err);
  });
});

console.log("[auris-whatsapp] Starting client...");
client.initialize();
