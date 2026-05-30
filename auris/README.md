# Auris

> Auris is an open-source, self-hostable **learning-agent engine** with an API at its
> core: it turns study material into an active study session. **Audio over WhatsApp is
> the flagship capability and first channel** — built for working adults who study during
> long commutes on low-end prepaid phones — but an LMS, a company's internal document
> system, or an MCP server are equally valid clients of the same engine.

The repository is a single repo, folder-separated into three modules:

| Module       | What it is                                                        | Talks to                          |
|--------------|-------------------------------------------------------------------|-----------------------------------|
| `engine/`    | The API core (Express). Owns the pipeline + prompt assembly.      | LLM / TTS / storage providers     |
| `whatsapp/`  | A thin [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) channel. **Zero generation logic.** | the engine, over HTTP only |
| `admin/`     | React + Vite settings app for non-technical educators.            | the engine's `/settings` + `/generate` |

The hard rule that makes the architecture real: the WhatsApp client never imports from
`engine/`. It only speaks HTTP to `http://localhost:$ENGINE_PORT`. You can `curl` the
engine and get audio with `whatsapp/` not running at all.

## Setup

```bash
cp .env.example .env
# Edit .env if you run the LIVE demo (Claude + ElevenLabs keys).
# For the no-key mock pipeline you can leave the keys blank — see "Swappable providers".
```

The **engine** consumes the repo-root `.env` (that is where your API keys belong). The
`whatsapp` and `admin` modules run on their built-in defaults; you only need to set their
optional overrides if you change the engine's port — and each reads its **own** module
`.env` (set `ENGINE_URL` in `whatsapp/.env`, `VITE_ENGINE_URL` in `admin/.env`), not the
root file.

Prerequisite: **Node 24** (global `fetch` / `FormData` are used directly — no `node-fetch`).

## Run (three processes)

Run each module in its own terminal:

```bash
cd engine   && npm i && npm run dev   # API core      → http://localhost:3000  (ENGINE_PORT)
cd whatsapp && npm i && npm run dev    # WhatsApp Web client (scan QR on first run)
cd admin    && npm i && npm run dev    # Settings app   → http://localhost:5173
```

Notes:

- **`whatsapp` needs a full `npm i` before the live demo.** `whatsapp-web.js` pulls in
  Puppeteer, which downloads a Chromium build. Budget for that download on first install.
- On first `whatsapp` run, a **QR code prints in the terminal** — scan it from WhatsApp on
  your phone (Linked Devices). The session persists under `whatsapp/.wwebjs_auth/`, so you
  only scan once.
- You do **not** need `whatsapp/` running to use the engine. The engine is the product;
  WhatsApp is one client of it.

## The API is the foundation

Auris is **API-first**. Every channel is a *client* of one synchronous endpoint,
`POST /generate`: WhatsApp today; an LMS, a company's internal-docs system, or an MCP
server tomorrow. None of them carry generation logic — they post material and receive an
audio study session plus the script text. Adding a channel is an integration against this
contract, not a fork of the engine.

The engine exposes:

| Endpoint            | Purpose                                                                 |
|---------------------|-------------------------------------------------------------------------|
| `POST /generate`    | Material in → `{ script, audioUrl, durationSec, quiz }` out (blocking).  |
| `GET /audio/:id`    | The generated MP3 (`audio/mpeg`). Files are ephemeral (wiped on restart).|
| `GET /settings`     | Current `settings.json`.                                                |
| `PUT /settings`     | Merge + persist settings; returns the updated settings.                 |
| `GET /health`       | `{ "ok": true }` liveness check.                                        |

`POST /generate` takes two input modes, branched by `Content-Type`:

- `application/json` → `{ "text": "...", "options"?: { ...partial GenerationOptions } }`
- `multipart/form-data` → part `file` (PDF, ≤ `MAX_UPLOAD_MB`) + optional part `options`
  (a JSON string)

Per-call `options` override `settings.json`. The WhatsApp client sends **no** `options`,
so it always uses the active settings — this is how an admin change in the settings app
reaches the next WhatsApp audio.

**200 envelope** (exact field names):

```json
{
  "script": "…full Spanish script, quiz narrated inline…",
  "audioUrl": "http://localhost:3000/audio/<id>.mp3",
  "durationSec": 142,
  "quiz": { "question": "¿Cuál es…?", "answer": "…" }
}
```

`quiz` is `null` when the quiz setting is off. The quiz is narrated *inline* in the script;
it is never synthesized as separate audio — the `quiz` field is metadata.

**Error envelope** — the engine emits a machine `code`; the WhatsApp client owns the Spanish
copy (and a generic catch-all for unknown codes, so the user is never left in silence):

```json
{ "error": { "code": "EXTRACTION_FAILED", "message": "…dev detail…" } }
```

| code                | HTTP | WhatsApp Spanish copy                               |
|---------------------|------|----------------------------------------------------|
| `UNSUPPORTED_FILE`  | 400  | "Solo puedo leer PDF o texto por ahora."           |
| `EXTRACTION_FAILED` | 422  | "No pude leer ese archivo, ¿puedes reenviarlo?"    |
| `PROVIDER_FAILED`   | 502  | "Algo falló generando tu audio, intenta de nuevo." |
| `TIMEOUT`           | 504  | "Tardó demasiado, intenta con menos material."     |

### Verifiable evidence (curl)

This proves channels are **decoupled from the engine**: you can `curl` the API and get audio
with `whatsapp/` **not running**.

```bash
# text mode
curl -s localhost:3000/generate -H 'Content-Type: application/json' \
  -d '{"text":"La fotosíntesis es…","options":{"tone":"formal"}}'
# file mode
curl -s localhost:3000/generate -F file=@notes.pdf -F options='{"duration":"corto"}'
# fetch the audio referenced by audioUrl
curl -s localhost:3000/audio/<id>.mp3 -o out.mp3
```

The pipeline behind `/generate`:

```
material → extract (pdf-parse | raw text) → truncate to INPUT_CHAR_CAP
        → engine assembles the prompt (settings + options)
        → LLMProvider.generateScript → { script, quiz }
        → TTSProvider.synthesize(script) → StorageProvider.save → envelope
```

The engine owns prompt assembly; providers are dumb transports.

## Swappable providers

The open-source value proposition lives in three interfaces (`engine/src/types.ts`), each
selected at runtime by a **factory** that reads an environment variable
(`engine/src/providers/index.ts`):

```ts
interface LLMProvider {
  generateScript(text: string, options: GenerationOptions):
    Promise<{ script: string; quiz: { question: string; answer: string } | null }>;
}
interface TTSProvider {
  synthesize(script: string, options: VoiceOptions): Promise<Buffer>; // MP3 bytes
}
interface StorageProvider {
  save(audio: Buffer, id: string): Promise<string>; // returns a serveable URL
}
```

You swap a provider by setting the matching **env var** — `LLM_PROVIDER`, `TTS_PROVIDER`,
`STORAGE_PROVIDER`. (The `providers` block inside `settings.json` is **display-only**: the
admin screen shows it read-only; the factory's source of truth is the environment.)

Registered providers today:

| Slot    | Env var            | Default        | Other registered |
|---------|--------------------|----------------|------------------|
| LLM     | `LLM_PROVIDER`     | `claude`       | `mock`           |
| TTS     | `TTS_PROVIDER`     | `elevenlabs`   | `mock`           |
| Storage | `STORAGE_PROVIDER` | `local`        | —                |

Defaults: **Claude** (`claude-sonnet-4-6`) / **ElevenLabs** (`eleven_multilingual_v2`) /
**local disk** (served via `GET /audio/:id`).

**Run the whole pipeline with no API keys** using the included mock providers:

```bash
LLM_PROVIDER=mock TTS_PROVIDER=mock npm run dev   # in engine/
```

`MockLLMProvider` returns a believable Spanish study script (honoring the `quiz` setting);
`MockTTSProvider` emits a real short MP3 (a 2s tone via `ffmpeg`, falling back to a minimal
silent MP3 frame if `ffmpeg` is absent). Storage stays `local` — local disk needs no key, so
there is no mock storage and none is needed.

**Adding a provider is: drop a file + register one line.** Implement the interface in a new
file under `engine/src/providers/`, then add a single entry to the matching registry in
`engine/src/providers/index.ts` (e.g. `r2: () => new R2StorageProvider()`). The envelope
shape never changes — a future R2/S3 storage impl uploads and returns a public URL; callers
see no difference.

## WhatsApp disclosure

The WhatsApp connection in this demo uses an **unofficial WhatsApp Web client**
([whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), driven by Puppeteer/
Chromium). It is **demo-only** and is **against WhatsApp's Terms of Service for production
use**. The production path is the **official WhatsApp Cloud API**. The real architecture is
the engine; WhatsApp is just one client of it, and swapping the channel does not touch the
engine.

## Self-host vision

Auris is **open-source and self-hostable**. The engine is model-, TTS-, and
storage-agnostic: bring your own LLM, your own voice, your own storage backend by selecting
or adding a provider. Because everything is API-first, integrating an LMS, an internal-docs
system, or an MCP server is an **integration** against `POST /generate`, **not a rewrite** —
the channel changes; the engine does not.

## Environment

All variables live in `.env.example` (copy to `.env`). The engine reads them; mock providers
need none. See `.env.example` for the full list and per-variable notes — the headline ones:

- `ENGINE_PORT` (3000), `ADMIN_ORIGIN` (CORS origin for the admin app)
- `LLM_PROVIDER` / `TTS_PROVIDER` / `STORAGE_PROVIDER`
- `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`, `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` / `ELEVENLABS_MODEL`
- `AUDIO_DIR`, `DEMO_CACHE_DIR` (empty = disabled), `MAX_UPLOAD_MB`, `INPUT_CHAR_CAP`

## License

Open-source (license TBD — to be added before public release).
