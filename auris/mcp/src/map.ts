/**
 * Auris MCP — PURE mapping helpers (no network, no SDK, no side effects).
 *
 * These turn engine results/errors into the MCP tool-result shape
 * ({ content: [{ type: "text", text }], isError? }). Kept pure so they can be
 * unit-tested without a running engine. index.ts is a thin shell that calls
 * the engine and then routes through these.
 */

/** The engine's 200 envelope for POST /generate (EXACT field names per contract). */
export interface GenerateEnvelope {
  script: string;
  audioUrl: string;
  durationSec: number;
  quiz: { question: string; answer: string } | null;
}

/** An MCP text content block. */
interface TextContent {
  type: "text";
  text: string;
}

/**
 * The subset of an MCP tool result the handlers produce. The index signature
 * keeps this structurally assignable to the SDK's CallToolResult type (which
 * carries `[x: string]: unknown` for forward-compatible extra fields).
 */
export interface ToolResult {
  content: TextContent[];
  isError?: boolean;
  [key: string]: unknown;
}

/**
 * Format a successful generate envelope as an MCP text result.
 * Layout:
 *
 *   Script:
 *   <script>
 *
 *   Audio: <audioUrl>  (durationSec: <n>)
 *   Quiz: ¿<question>? → <answer>     (or "Quiz: (off)" when quiz is null)
 */
export function envelopeToContent(envelope: GenerateEnvelope): ToolResult {
  const quizLine = envelope.quiz
    ? `Quiz: ${envelope.quiz.question} → ${envelope.quiz.answer}`
    : "Quiz: (off)";

  const text = [
    "Script:",
    envelope.script,
    "",
    `Audio: ${envelope.audioUrl}  (durationSec: ${envelope.durationSec})`,
    quizLine,
  ].join("\n");

  return { content: [{ type: "text", text }] };
}

/** The machine error codes the engine emits (see engine/src/types.ts ErrorCode). */
const KNOWN_CODES = new Set([
  "UNSUPPORTED_FILE",
  "EXTRACTION_FAILED",
  "PROVIDER_FAILED",
  "TIMEOUT",
]);

/**
 * Map an engine error (machine code + message) to an isError MCP result.
 * Known codes surface the code prefix; unknown/missing codes fall back to a
 * generic "generation failed" line. Never silent.
 */
export function engineErrorToResult(
  code: string | undefined,
  message: string | undefined,
): ToolResult {
  const detail = message && message.trim().length > 0 ? message.trim() : undefined;

  let text: string;
  if (code && KNOWN_CODES.has(code)) {
    text = detail ? `${code}: ${detail}` : code;
  } else {
    text = detail ? `generation failed: ${detail}` : "generation failed";
  }

  return { isError: true, content: [{ type: "text", text }] };
}
