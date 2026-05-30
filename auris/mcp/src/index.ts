/**
 * Auris MCP server — a thin stdio MCP client of the Auris engine.
 *
 * HARD RULES:
 *   - Zero generation logic lives here. No prompt assembly, no LLM/TTS calls.
 *   - NO import from ../engine — only HTTP to the engine via ./engine.
 *   - stdout IS the JSON-RPC channel under stdio. ALL diagnostics go to stderr
 *     (console.error). NEVER console.log here.
 *
 * Exposes two tools:
 *   - generate_audio_lesson  -> POST /generate (text mode, application/json)
 *   - get_settings           -> GET  /settings (read-only, free)
 *
 * Out of scope (by design): PDF/multipart, raw MP3 bytes, PUT /settings,
 * prompts/resources, HTTP/SSE transport.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import * as engine from "./engine.js";
import { engineErrorToResult, envelopeToContent } from "./map.js";

const server = new McpServer({
  name: "auris-mcp",
  version: "1.0.0",
});

// ─── generate_audio_lesson ───────────────────────────────────────────────────
// PRIMARY tool. Text mode only. Override fields are optional; only the ones the
// caller provides are forwarded to the engine (it fills the rest from settings).
server.registerTool(
  "generate_audio_lesson",
  {
    title: "Generate audio lesson",
    description:
      "Turn study material (plain text) into a Spanish spoken audio lesson via the Auris engine. " +
      "Returns the script, the generated audio URL, duration, and an optional quiz. " +
      "Requires the engine running on :3000; a real call uses live LLM+TTS providers.",
    inputSchema: {
      text: z
        .string()
        .min(1)
        .describe("Study material (plain text) to turn into a Spanish audio lesson."),
      tone: z.enum(["formal", "casual"]).optional(),
      focus: z.enum(["repaso", "examen"]).optional(),
      level: z.enum(["principiante", "avanzado"]).optional(),
      duration: z.enum(["corto", "medio"]).optional(),
      quiz: z.boolean().optional(),
    },
  },
  async ({ text, tone, focus, level, duration, quiz }) => {
    try {
      const envelope = await engine.generate(text, {
        tone,
        focus,
        level,
        duration,
        quiz,
      });
      return envelopeToContent(envelope);
    } catch (err) {
      if (err instanceof engine.EngineError) {
        return engineErrorToResult(err.code, err.message);
      }
      // Unexpected (network down, etc.) — surface it, never silent.
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[auris-mcp] generate_audio_lesson failed:", detail);
      return engineErrorToResult(undefined, detail);
    }
  },
);

// ─── get_settings ────────────────────────────────────────────────────────────
// Read-only GET /settings. No input, no provider cost.
server.registerTool(
  "get_settings",
  {
    title: "Get engine settings",
    description:
      "Read the Auris engine's current generation settings (tone, focus, level, " +
      "duration, quiz, providers) as JSON. Read-only; no provider cost.",
    inputSchema: {},
  },
  async () => {
    try {
      const settings = await engine.getSettings();
      return {
        content: [{ type: "text", text: JSON.stringify(settings, null, 2) }],
      };
    } catch (err) {
      if (err instanceof engine.EngineError) {
        return engineErrorToResult(err.code, err.message);
      }
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[auris-mcp] get_settings failed:", detail);
      return engineErrorToResult(undefined, detail);
    }
  },
);

// ─── Boot ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr ONLY — stdout is reserved for JSON-RPC.
  console.error(`[auris-mcp] ready on stdio (engine: ${engine.engineUrl})`);
}

main().catch((err) => {
  console.error("[auris-mcp] fatal:", err);
  process.exit(1);
});
