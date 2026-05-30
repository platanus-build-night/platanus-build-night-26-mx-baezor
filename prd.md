# Auris — PRD (v1 / Hackathon)

**One line:** Auris is an open-source, self-hostable **learning-agent engine** with an API at its core: it turns study material into an active study session. **Audio over WhatsApp is the flagship capability and first channel** — built for working adults who study during long commutes on low-end prepaid phones — but an LMS, a company's internal document system, or an MCP server are equally valid clients of the same engine.

> Scope note: this PRD covers the hackathon v1 only. It is deliberately narrow. Anything not in P0 is explicitly deferred.

> **v1 priority order (in case time runs short):**
>
> 1. **Complete API v1** — it is verifiable evidence to be submitted, so it must be complete and callable on its own (curl/Postman), independent of any live demo.
> 2. **Functional demo running locally** — the WhatsApp client calling that API end to end on the builder's machine.
> 3. Everything else (thin admin screen, etc.) only after 1 and 2 are solid.
>    The public project landing site is a separate, later repo and is not part of v1.

> **Demo disclaimer (state this openly):** the demo's WhatsApp connection uses an _unofficial_ WhatsApp Web client (e.g. whatsapp-web.js). This is for the demo only and is against WhatsApp's terms for production use; the production path is the official WhatsApp Cloud API. Do not present the WhatsApp client as the real architecture; the real architecture is the API core (see below), of which WhatsApp is just one client.

> **Demo providers:** the demo uses **Claude** as the LLM and **ElevenLabs** as the TTS voice. These are defaults, not dependencies. The engine is provider-agnostic: any LLM and any TTS service can be connected via config.

---

## Problem

Working adults in Mexico spend up to three hours a day commuting, often on low-end phones with prepaid, data-scarce plans. On a packed bus or metro they cannot read or watch video, so that time is lost for study. Existing AI audio tools (e.g. NotebookLM) prove people love learning by audio, but assume a capable phone, an account, and spare data, so they never reach this user.

## Goals

Auris is a learning-agent engine, not an audio tool. Audio over WhatsApp is the first and flagship way to prove it, but the engine's real job is to turn material into an active, teaching study session that any channel can deliver. The constraint that forces audio — a commuter on a low-end prepaid phone who can't read or watch — is the wedge, not the ceiling.

- **Be API-first.** The engine's core capability (material in → audio study session out) is exposed as an API. Every delivery channel, including WhatsApp, is a client of that API, never the engine itself. This is what lets an LMS, an internal company system, or an MCP server plug in later without rebuilding the core.
- Let a user turn study material into a commute-ready audio study session with zero friction.
- Deliver that audio through a channel the user already has and that costs no data: WhatsApp.
- Make the audio actively teach, not just narrate (include a quiz beat).
- Ship as an open-source, self-hostable engine that is model-agnostic and TTS-agnostic.
- Produce one reliable end-to-end demo: send material in WhatsApp, receive an audio study session back, with the WhatsApp client visibly calling the same API anything else would.

## Non-Goals (v1)

- **No user accounts, auth, or persistence.** Stateless request/response only. Deferred to keep the build to one day.
- **No spaced repetition / progress tracking.** Conceptually core to the product, but out of scope for v1.
- **No institution dashboard or multi-tenant management.** The self-hosted/institution story is pitched, not built yet. The v1 admin screen shows and adjusts settings only; it does NOT manage cohorts, students, groups, or progress.
- **No official WhatsApp Business API.** Demo uses an unofficial WhatsApp Web client; production path is Cloud API, not built here.
- **No production-grade content quality tuning.** One good script format is enough for the demo.

## Users

- **Primary:** the adult learner commuting on a prepaid low-end phone (end recipient of the audio).
- **Secondary (pitched, not built in v1):** the institution that self-hosts Auris on its own material.

## User Stories (v1)

- As a learner, I want to send my study material (PDF or photo of notes) to a WhatsApp number, so that I get audio I can listen to on my commute.
- As a learner, I want the audio to fit my commute and teach the material clearly, so that the time is actually useful.
- As a learner, I want the audio to ask me a question and let me answer, so that I am recalling, not just listening.
- As a learner on a prepaid plan, I want to receive it via WhatsApp, so that it costs me no data.
- As a non-technical educator, I want to adjust how the audio is generated (tone, focus, level, length, quiz) using plain controls, so that I can tailor it to my cohort without touching code.
- As a technical admin self-hosting Auris, I want full control over the underlying system prompt under an advanced section, so that I can customize behavior deeply without cluttering the educator's view.

## Requirements

### Must-Have (P0) — the demo fails without these

1. **Core API endpoint (the foundation).** Expose the engine's capability as an HTTP API: accept study material (uploaded file or text) plus options, return a generated audio study session. This endpoint is the product; everything else calls it.
   - Given a request with material, when posted to the endpoint, then the response yields the generated audio (file or URL) plus the script text.
   - The endpoint must be usable independently of WhatsApp (testable with curl/Postman), proving channels are decoupled from the engine.
   - Keep the surface minimal: one core generate endpoint is enough for v1. Do not build auth, rate limiting, or a full REST suite.

2. **WhatsApp as a client of the API.** The WhatsApp loop receives material, calls the core API, and returns the result. It contains no generation logic of its own.
   - Given a user sends a PDF or image to the number, when the message arrives, then the WhatsApp client acknowledges ("Generando tu audio...") and calls the same API any other client would.

3. **Extract text from the material.** Parse PDF text; OCR for images. (Lives behind the API.)
   - Given a supported file, when processed, then usable text is extracted. On failure, the caller gets a clear error; the WhatsApp client surfaces it in Spanish, not silence.

4. **Generate a study script via an LLM.** Turn extracted text into a spoken-friendly Spanish study script that explains the material and includes one quiz beat (question, pause, reveal). The LLM provider must be swappable (model-agnostic).

5. **Synthesize the script to audio.** Convert the script to an MP3 via a TTS provider. The TTS provider must be swappable (TTS-agnostic).

6. **Return the audio to the caller.** The API returns the audio; the WhatsApp client relays it back to the user as a playable voice note.
   - Given audio is generated, when sent over WhatsApp, then the user receives a voice-note bubble that plays inline.

7. **Provider abstraction.** LLM and TTS access go through a thin interface so a provider can be swapped via config, not code edits. This is the open-source value prop and must be visible in the codebase. Demo defaults: Claude (LLM) and ElevenLabs (TTS).

8. **Basic admin / settings screen (thin, non-technical, demo-only).** A single screen designed for a non-technical user (a teacher or professor managing a cohort), who can easily see and adjust how the audio is generated, without touching code or jargon. Inspired in WordPress admin screens: simple, collapsible sections, plain language, no technical terms by default.
   - **Audience:** the primary user of this screen is a non-technical educator. Language and controls must be plain (e.g. "Tono: formal / casual", "Enfoque: repaso / examen", "Nivel: principiante / avanzado", "Duración del audio", "Incluir quiz: sí / no"). No technical terms surfaced by default.
   - **Everything is configurable, including system prompts** — but layered by audience. Simple natural-language controls for the educator on top; the raw, fully editable system prompt lives under a collapsed **"Avanzado"** section for the technical admin who self-hosts. The educator never sees a prompt unless they open Advanced.
   - **Also shows** the active LLM and TTS providers (Claude / ElevenLabs) and that they are swappable.
   - **Scope limit (demo-only, no real management):** show and adjust settings; adjustments may affect the generated output during the demo, but need not persist or be stored per-user. NO cohort/student management, NO accounts, NO auth, NO roles. If it grows into student/group management or persistence, it has exceeded v1 scope.
   - Given the educator opens the screen, when they change a simple control (e.g. tone to "formal"), then a subsequently generated audio reflects it; the system prompt remains editable under Advanced for technical users.

### Nice-to-Have (P1) — only if time remains

- **Interactive tutoring loop (turns narration into a real agent).** Instead of one-way narration, the session asks its quiz question, the learner replies (voice or text) over WhatsApp, and the engine responds to that answer — one back-and-forth tutoring turn. This is what makes the "learning-agent" framing literally true rather than aspirational. Kept at P1 because the one-way generate-and-return path (P0) must land cleanly first.
- Commute-length input ("tengo 35 minutos") that sizes the script.
- Multiple output formats (plain explanation vs. dialogue/podcast vs. quiz-heavy).
- A minimal web upload fallback (browser → audio) in case the WhatsApp loop is unstable on stage.

### Future Considerations (P2) — design so as not to block these

- Accounts + spaced repetition across commutes.
- Institution self-host deployment (Docker, config, "run your own" docs) — the WordPress-style model.
- **Additional API clients beyond WhatsApp:** an LMS integration, a connector to a company's internal document system where material already lives, and an **MCP server** exposing Auris to AI tools. The API-first design exists precisely so these are integrations, not rewrites.
- Official WhatsApp Cloud API delivery.
- Pre-built, exam-aligned content packs (e.g. prepa curriculum).

## Technical Notes

- **Demo runtime:** the engine runs **locally** (builder's machine) for the hackathon. No production deployment of the engine is required for v1. This removes earlier Cloudflare Workers constraints, so the WhatsApp library is a free choice again (whatsapp-web.js is viable since it no longer needs to run in Workers).
- **Public project site (out of scope, separate repo):** the open-source landing page (the "what is Auris / run your own" site, like wordpress.org) is a _later_ deliverable, in its own repository, intended for Cloudflare Workers. Not part of v1. Build only if time remains after the two priorities below.
- **Architecture:** API core + clients. The engine lives behind HTTP endpoints. Goal is that every part of the system is modular. Clients (WhatsApp now; LMS/internal systems/MCP later) call that endpoint and own only their own channel logic.
- **Pipeline shape (behind the API):** material in → extract text → LLM script → TTS → MP3 → return.
- **WhatsApp client (demo only):** unofficial WhatsApp Web client (e.g. whatsapp-web.js) that calls the core API. Runs locally alongside the engine. Use a throwaway number, persisted session, warmed up before the demo. Holds no generation logic. Not the production path.
- **Decoupling discipline:** the WhatsApp client must hold zero generation logic. If you can't `curl` the API and get audio without WhatsApp running, the layering is wrong. This is also what makes the API-first claim demonstrable to judges.
- **Latency risk:** end-to-end generation may exceed demo patience. Mitigation: keep demo input small (one page/paragraph); allow a pre-generated cached MP3 for the known demo input as a fallback.
- **Provider config:** LLM and TTS keys/endpoints in env/config; interfaces documented in the README. Demo defaults are Claude (LLM) and ElevenLabs (TTS), wired through the same swappable interface any other provider would use.

## Open Questions

- **[Eng]** PDF-only for v1, or also image/OCR? OCR adds reliability risk on a one-day build. (Non-blocking; default to PDF-only if time is tight.)
- **[Product]** Does the demo include the quiz beat, or narration only? Quiz is more impressive but harder to land cleanly in a short voice note. (Non-blocking; can cut to narration-only.)

## Definition of Done (v1)

- [ ] **API v1 is complete and callable on its own** (curl/Postman, no WhatsApp needed): posted material returns an audio study session plus script text. This is the submitted evidence.
- [ ] A PDF sent to the WhatsApp number returns a playable Spanish audio study session locally, with the WhatsApp client calling that same API.
- [ ] The returned audio explains the material and includes at least one quiz beat.
- [ ] LLM and TTS providers are swappable via config, documented in the README. Demo defaults: Claude / ElevenLabs.
- [ ] A cached-audio fallback path exists for the demo input.
- [ ] A thin settings screen lets a non-technical educator adjust generation with plain controls (tone, focus, level, length, quiz), shows the active providers, and exposes the full system prompt under a collapsed "Avanzado" section. (Only after the above are solid.)
- [ ] The demo openly discloses the WhatsApp connection is unofficial and demo-only.
- [ ] README explains setup, the API as the foundation, and the self-host vision.

---

# Locked v1.0 Build Spec

> This section is the buildable contract derived from a decision-grilling pass. Where it differs from the narrative above, **this section wins**. It resolves both Open Questions and the latent "stateless" contradiction. An agent team should be able to start from here without further clarification.

## Decisions resolved (changelog vs. narrative above)

- **"Stateless" reworded:** means *no user accounts, no sessions, no database* — **not** "no config." A single global `settings.json` is in scope.
- **Open Question [Eng] resolved:** **PDF + raw text** in P0; **OCR (printed text only, never handwriting)** demoted to **P1 stretch**. User story reworded to "PDF or pasted text."
- **Open Question [Product] resolved:** **quiz beat stays in P0** as a prompt-driven *question → pause → reveal*, gated by a `quiz` on/off setting. The setting is the escape hatch (flip off at demo time if it sounds bad); no code cut needed. DoD checkbox stands.
- **New abstraction:** **Storage** joins LLM and TTS as a third swappable provider (default = local disk).
- **Q5 refinement:** the LLM provider returns **structured output** (`{ script, quiz }`), not a bare string, so the envelope's structured `quiz` field never requires re-parsing the script.

## Stack & repo

- **All TypeScript/Node.** No second runtime.
- **Single repo, folder-separated:**
  - `/engine` — the API core: pipeline, `/generate`, `/settings`, `/audio`. Express or Fastify. Owns prompt assembly.
  - `/whatsapp` — `whatsapp-web.js` client. **Talks to the engine ONLY over `http://localhost:$ENGINE_PORT`.** Holds zero generation logic. Hard rule: no `import` from `/engine`.
  - `/admin` — React/Vite settings app (its own `package.json`/build). Client of `/settings` and `/generate`.
- **Decoupling test (must hold):** `curl` the engine and get audio with `/whatsapp` not running.

## API contract

### `POST /generate` (synchronous, blocking)

Two input modes, branched by `Content-Type`:

- **Text:** `application/json` → `{ "text": "...", "options"?: { ...partial GenerationOptions } }`
- **File:** `multipart/form-data` → part `file` (PDF, ≤ `MAX_UPLOAD_MB`) + part `options` (JSON string, optional)

`options` override `settings.json` per-call. The WhatsApp client sends **no** `options` → uses active settings (this is how an admin change reaches the next WhatsApp audio).

**200 response — JSON envelope:**
```json
{
  "script": "…full Spanish script, quiz narrated inline…",
  "audioUrl": "http://localhost:3000/audio/<id>.mp3",
  "durationSec": 142,
  "quiz": { "question": "¿Cuál es…?", "answer": "…" }
}
```
`quiz` is `null` when the `quiz` setting is off.

**Error response — fixed code table** (engine returns `code`; the WhatsApp client owns the Spanish copy, with a generic catch-all for unknown codes — "not silence"):

| code | HTTP | WhatsApp (es) |
|---|---|---|
| `UNSUPPORTED_FILE` | 400 | "Solo puedo leer PDF o texto por ahora." |
| `EXTRACTION_FAILED` | 422 | "No pude leer ese archivo, ¿puedes reenviarlo?" |
| `PROVIDER_FAILED` | 502 | "Algo falló generando tu audio, intenta de nuevo." |
| `TIMEOUT` | 504 | "Tardó demasiado, intenta con menos material." |

```json
{ "error": { "code": "EXTRACTION_FAILED", "message": "…" } }
```

### `GET /audio/:id` → `audio/mpeg` (the MP3). Files ephemeral (wiped on restart; no cleanup logic in v1).
### `GET /settings` → current `settings.json`.
### `PUT /settings` → merge + persist; returns updated settings.

> No job queue, no polling, no `/tutor`, no streaming, no `/admin` served by the engine (admin is its own Vite app). Engine enables `cors()` for `$ADMIN_ORIGIN`.

## Pipeline (behind `/generate`)

`material → extract (pdf-parse | raw text) → truncate to INPUT_CHAR_CAP → engine assembles prompt (settings + options) → LLMProvider.generateScript → { script, quiz } → TTSProvider.synthesize(script) → StorageProvider.save → envelope`

Internal time budget ~90s; emit `TIMEOUT` if exceeded. HTTP server timeout 120s.

## Provider interfaces (the open-source value prop — must be visible)

```ts
interface LLMProvider {
  generateScript(text: string, options: GenerationOptions):
    Promise<{ script: string; quiz: { question: string; answer: string } | null }>;
}
interface TTSProvider {
  synthesize(script: string, options: VoiceOptions): Promise<Buffer>; // MP3 bytes
}
interface StorageProvider {
  save(audio: Buffer, id: string): Promise<string>; // returns serveable URL
}
```

- Selected by env var; a factory reads env → returns the impl. Adding a provider = drop a file + register.
- **Engine owns prompt assembly**; providers are dumb transports. Swapping the LLM never loses the prompt.
- TTS synthesizes **only `script`** (quiz is inline). `quiz` is metadata — never synthesized separately.
- Defaults: `ClaudeProvider`, `ElevenLabsProvider`, `LocalDiskProvider`. Local disk serves via `GET /audio/:id`; a future R2/S3 impl uploads and returns a public URL — envelope shape unchanged.

## Settings schema (`settings.json` — global, single instance, edited from admin)

```ts
type Tone = "formal" | "casual";
type Focus = "repaso" | "examen";
type Level = "principiante" | "avanzado";
type Duration = "corto" | "medio";              // corto≈2min/~300w (default), medio≈4min/~600w
interface GenerationOptions {
  tone: Tone; focus: Focus; level: Level; duration: Duration; quiz: boolean;
  systemPrompt?: string;                          // "Avanzado" raw override; engine still assembles final prompt
}
```
```json
{
  "tone": "casual", "focus": "repaso", "level": "principiante",
  "duration": "corto", "quiz": true,
  "systemPrompt": "<default editable template>",
  "providers": { "llm": "claude", "tts": "elevenlabs", "storage": "local" }
}
```
Read at startup, rewritten on `PUT /settings`. Merge order: `settings.json` (base) ← request `options` (override).

## Admin app (`/admin`, React/Vite)

Non-technical educator audience. Plain-language controls only (Tono, Enfoque, Nivel, Duración, Incluir quiz). Shows active LLM/TTS/Storage providers (read-only, "swappable"). Raw `systemPrompt` lives under a collapsed **"Avanzado"** section. Reads/writes `/settings`; may call `/generate` for a live-preview beat. **No** cohort/student/account/role management.

## Caps & defaults

- **Output language:** Spanish, fixed for v1 (config later).
- **LLM default:** `claude-sonnet-4-6` (configurable via `ANTHROPIC_MODEL`).
- **TTS default:** ElevenLabs `eleven_multilingual_v2` + configurable Spanish-capable `ELEVENLABS_VOICE_ID`.
- **Input truncation:** `INPUT_CHAR_CAP=6000` chars of extracted text.
- **Max upload:** `MAX_UPLOAD_MB=10`.
- **Duration:** presets `corto`/`medio` only; default `corto` to keep MP3s small/fast. **Single TTS call — no chunking.**

## Cached demo fallback (engine-side, env-gated, OFF by default)

Hash the extracted text (sha256). If `DEMO_CACHE_DIR` is set **and** `${hash}.mp3` + `${hash}.json` exist there, short-circuit and return them immediately (doubles as a latency dodge). Default off, so the submitted "verifiable evidence" API always runs the real pipeline; flip the env var only for the live stage demo. Lives in the engine so any client benefits and decoupling holds.

## Anti-requirements (do NOT build in v1)

No accounts/auth/sessions/database · no conversation or session state · no `/tutor` endpoint · no spaced repetition / progress tracking · no multi-tenant / cohort / student management · no rate limiting · no OCR in P0 · no TTS chunking · no streaming / SSE · no job queue · no official WhatsApp Cloud API.

## Env vars

```
ENGINE_PORT=3000
ADMIN_ORIGIN=http://localhost:5173
LLM_PROVIDER=claude
TTS_PROVIDER=elevenlabs
STORAGE_PROVIDER=local
ANTHROPIC_API_KEY=…
ANTHROPIC_MODEL=claude-sonnet-4-6
ELEVENLABS_API_KEY=…
ELEVENLABS_VOICE_ID=…
ELEVENLABS_MODEL=eleven_multilingual_v2
AUDIO_DIR=./audio
DEMO_CACHE_DIR=                 # empty = disabled
MAX_UPLOAD_MB=10
INPUT_CHAR_CAP=6000
```

## Run (three processes)

```
cd engine   && npm i && npm run dev    # API on :3000
cd whatsapp && npm i && npm run dev     # whatsapp-web.js; scan QR, persist session, warm up before demo
cd admin    && npm i && npm run dev     # Vite on :5173
```

## Verifiable-evidence curls (the submission artifact)

```bash
# text mode
curl -s localhost:3000/generate -H 'Content-Type: application/json' \
  -d '{"text":"La fotosíntesis es…","options":{"tone":"formal"}}'
# file mode
curl -s localhost:3000/generate -F file=@notes.pdf -F options='{"duration":"corto"}'
# fetch the audio referenced by audioUrl
curl -s localhost:3000/audio/<id>.mp3 -o out.mp3
```
