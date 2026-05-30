# Auris MCP server

A thin **stdio MCP server** that exposes the Auris engine's `generate` and
`settings` endpoints to AI tools (Claude Desktop, etc.). It holds **zero
generation logic** — no prompt assembly, no LLM/TTS calls, no imports from the
engine. Every request is relayed to the engine over HTTP and the result is
returned as MCP text content. Same shape as the WhatsApp client: a thin process
that talks to the engine on `http://localhost:3000` only.

## Run

```bash
npm install
npm run dev      # tsx src/index.ts  (stdio; talks JSON-RPC on stdout)
```

Other scripts: `npm run typecheck` (`tsc --noEmit`), `npm test` (vitest unit
tests of the pure mapping helpers), `npm run build` (`tsc` → `dist/`).

> Under stdio, **stdout is the JSON-RPC channel**. All diagnostics are written
> to stderr; nothing else touches stdout.

## Tools

### `generate_audio_lesson`
Turn study material (plain text) into a Spanish spoken audio lesson
(`POST /generate`, `application/json`). Returns the script, audio URL, duration,
and an optional quiz as a text block. Inputs:

| field      | type                                   | required |
| ---------- | -------------------------------------- | -------- |
| `text`     | string (min 1)                         | yes      |
| `tone`     | `"formal" \| "casual"`                 | no       |
| `focus`    | `"repaso" \| "examen"`                 | no       |
| `level`    | `"principiante" \| "avanzado"`         | no       |
| `duration` | `"corto" \| "medio"`                   | no       |
| `quiz`     | boolean                                | no       |

Only the override fields you provide are forwarded; the engine fills the rest
from its active `settings.json`.

### `get_settings`
Read-only `GET /settings`. No input. Returns the engine's current settings JSON
(tone, focus, level, duration, quiz, providers). No provider cost.

## Client config

**Dev (run TypeScript directly via tsx):**

```json
{ "mcpServers": { "auris": { "command": "npx", "args": ["tsx", "/Users/baezor/dev/platanus/auris/mcp/src/index.ts"], "env": { "ENGINE_URL": "http://localhost:3000" } } } }
```

**Built (after `npm run build`):**

```json
{ "mcpServers": { "auris": { "command": "node", "args": ["/Users/baezor/dev/platanus/auris/mcp/dist/index.js"], "env": { "ENGINE_URL": "http://localhost:3000" } } } }
```

## ENGINE_URL

`ENGINE_URL` (or `ENGINE_PORT`, default `3000`) sets the engine base URL. It can
be passed via the client config `env` block (above) or a module-local `.env`
(see `.env.example`). Resolution mirrors the WhatsApp client:
`ENGINE_URL ?? http://localhost:${ENGINE_PORT ?? "3000"}`, trailing slashes
stripped.

> The **engine must be running on :3000** for real generation. `tools/list` and
> the MCP handshake work with the engine down; `get_settings` is free; a real
> `generate_audio_lesson` call uses live LLM+TTS providers (cost).

## Scope

**In scope:** stdio transport; text-mode `generate`; read-only `settings`;
returning script + audio URL + quiz as text.

**Out of scope:** PDF/multipart input; returning raw MP3 bytes; `PUT /settings`
(writes); MCP prompts/resources; HTTP/SSE transport.
