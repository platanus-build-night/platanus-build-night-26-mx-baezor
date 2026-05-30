# Auris

<img src="./project-logo.png" alt="Auris" width="160" />

**Open-source, self-hostable learning-agent engine that turns study material into WhatsApp audio study sessions.**

Send study material (PDF or text) and get back a Spanish audio study session that
*teaches* it and includes a quiz beat. Auris is built for working adults who study
during long commutes on low-end, prepaid, data-scarce phones — so its flagship
channel is audio over **WhatsApp** (no data cost, a number they already have). But
the engine is the product: every channel is a client of the same API.

> _Platanus Build Night — Ciudad de México · Hacker: Angel Baez ([@baezor](https://github.com/baezor))_

## Architecture — API core + clients

The engine lives behind HTTP endpoints; each client owns only its own channel and
holds **zero generation logic**. Pipeline: `material → extract → LLM script → TTS → MP3 → return`.

| Package | What it is |
|---|---|
| [`auris/engine`](./auris) | The API core (Express). `POST /generate`, `GET /audio/:id`, `GET/PUT /settings`. Swappable **LLM / TTS / Storage** providers via config — Claude, ElevenLabs, local disk, plus keyless **mock** providers. |
| `auris/whatsapp` | WhatsApp demo client (whatsapp-web.js). Talks to the engine over HTTP only. _Unofficial/demo — production path is the official Cloud API._ |
| `auris/admin` | React + Vite admin: a non-technical educator settings screen and an institutional dashboard mockup. |
| `auris/mcp` | A Model Context Protocol server exposing the engine to AI tools (`generate_audio_lesson`, `get_settings`) over stdio. |

Provider-agnostic by design: swapping the LLM or TTS is a config change, not a code edit.

## Quick start

```bash
cd auris/engine   && npm i && npm run dev   # API core      → http://localhost:3000
cd auris/whatsapp && npm i && npm run dev   # WhatsApp demo  → scan the QR
cd auris/admin    && npm i && npm run dev   # admin (Vite)   → http://localhost:5173
```

Copy `auris/.env.example` → `auris/.env` and add your `ANTHROPIC_API_KEY` and
`ELEVENLABS_API_KEY` for the live demo. No keys? Run the engine with
`LLM_PROVIDER=mock TTS_PROVIDER=mock` to exercise the full pipeline for free.

Verify the API on its own (decoupled from any channel):

```bash
curl -s localhost:3000/generate -H 'Content-Type: application/json' \
  -d '{"text":"La fotosíntesis es…","options":{"tone":"formal"}}'
```

More: **[`auris/README.md`](./auris)** (full engine + setup docs) ·
[`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`CHANGELOG.md`](./CHANGELOG.md). Tests: `npm test`.

## ⚠️ Deploying (Vercel, Render, etc.)

Deploy platforms like **Vercel**, **Render** or **Netlify** can only connect to
repositories **you own** — they can't be granted access to this organization repo.
To deploy while keeping your commits here, mirror your code to a personal repo:

1. Create a **personal** repository on your own GitHub account.
2. Point your local `origin` at **both** repos, so a single `git push` updates each one:

   ```bash
   # this org repo (keep it as a push target)...
   git remote set-url --add --push origin https://github.com/platanus-build-night/platanus-build-night-26-mx-baezor.git
   # ...and your personal repo
   git remote set-url --add --push origin https://github.com/<your-user>/<your-repo>.git
   ```

   From now on `git push` sends every commit to **both** repositories.
3. Connect your deploy service (Vercel, Render, …) to your **personal** repo and deploy from there.

Your commits stay mirrored here for judging, while the deploy runs from the repo you control.

Have fun! 🚀
