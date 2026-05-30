# Contributing to Auris

Thanks for working on Auris. This is a small monorepo with three independent
Node packages. Keep changes scoped, keep the API-first contract stable, and keep
the `CHANGELOG.md` up to date.

## Prerequisites

- **Node 24** (the WhatsApp and admin packages target Node 24 types).
- npm (ships with Node).

## Layout

The repo root holds shared tooling (Husky, aggregate scripts, changelog). The
three packages live under `auris/`:

```
auris/
  engine/      API core — /generate, /settings, /audio; swappable LLM/TTS/Storage providers
  whatsapp/    WhatsApp demo client — relays material to the engine, returns audio
  admin/       React + Vite admin — settings + institutional dashboard mockup
```

Each package has its own `package.json`, dependencies, and tests. There is no
npm workspaces wiring; the root scripts delegate per package via `--prefix`.

## Install and run

Each package is installed and run on its own:

```bash
cd auris/engine   && npm i && npm run dev   # API engine (port 3000)
cd auris/whatsapp && npm i && npm run dev   # WhatsApp client (port 4000)
cd auris/admin    && npm i && npm run dev   # Vite admin dev server (port 5173)
```

## Tests

Run the full aggregate suite from the repo root:

```bash
npm test
```

Or test a single package:

```bash
npm test --prefix auris/engine
npm test --prefix auris/whatsapp
npm test --prefix auris/admin
```

Type-check everything from the root with `npm run typecheck`.

## Pre-commit hook

A Husky `pre-commit` hook runs `npm run typecheck` then `npm test` from the repo
root before every commit. Make sure both pass locally before committing. If you
add a new package, wire it into the root `test` and `typecheck` scripts.

## Commit messages

Use short, scoped, conventional-ish messages: `scope: imperative summary`
(e.g. `engine: add /settings validation`, `admin: dashboard analytics tab`).

Update `CHANGELOG.md` (the `## [Unreleased]` section) whenever you make a notable
change, using the standard Added / Changed / Fixed groupings.
