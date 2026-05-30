/**
 * Spanish user-facing copy for the WhatsApp channel.
 *
 * HARD RULE: the engine emits a machine `error.code`; the WhatsApp module owns
 * every Spanish string the user actually sees. The four mapped codes below are
 * verbatim from the LOCKED BUILD CONTRACT error table. `GENERIC_FALLBACK` covers
 * any unknown / unmapped code, thrown fetch errors, or an unreachable engine —
 * so the user is NEVER left in silence.
 */

/** Codes the engine can emit in `{ error: { code, message } }`. */
export type EngineErrorCode =
  | "UNSUPPORTED_FILE"
  | "EXTRACTION_FAILED"
  | "PROVIDER_FAILED"
  | "TIMEOUT";

/** Exact Spanish copy per the contract's fixed error table. */
const ERROR_COPY: Record<EngineErrorCode, string> = {
  UNSUPPORTED_FILE: "Solo puedo leer PDF o texto por ahora.",
  EXTRACTION_FAILED: "No pude leer ese archivo, ¿puedes reenviarlo?",
  PROVIDER_FAILED: "Algo falló generando tu audio, intenta de nuevo.",
  TIMEOUT: "Tardó demasiado, intenta con menos material.",
};

/** Generic catch-all — never silence. */
export const GENERIC_FALLBACK = "Algo salió mal, intenta de nuevo.";

/** Sent the moment a valid request is received, before calling the engine. */
export const ACK = "Generando tu audio...";

/**
 * Map an engine error code (or anything unknown) to user-facing Spanish copy.
 * Any code outside the fixed table — including `undefined` — falls back to the
 * generic message.
 */
export function copyForErrorCode(code: string | undefined | null): string {
  if (code && code in ERROR_COPY) {
    return ERROR_COPY[code as EngineErrorCode];
  }
  return GENERIC_FALLBACK;
}

/**
 * True if `text` is one of the bot's own outgoing strings (the ack, the generic
 * fallback, or any mapped error copy). Used to skip our own replies when we also
 * listen to fromMe messages (so the self-chat can be a demo input without the
 * bot reacting to the messages it just sent — i.e. no reply loop).
 */
export function isBotCopy(text: string | undefined | null): boolean {
  const t = (text ?? "").trim();
  if (!t) return false;
  if (t === ACK || t === GENERIC_FALLBACK) return true;
  return (Object.values(ERROR_COPY) as string[]).includes(t);
}
