# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-29

### Added

- **Engine core (API-first).** Express service exposing `/generate` (material in,
  audio study session out), `/settings`, and `/audio` endpoints, with a contract
  error handler that returns a stable `{ error: { code, message } }` shape.
- **Swappable providers.** Provider-agnostic LLM, TTS, and Storage layers selected
  by config: Claude (LLM), ElevenLabs (TTS), local disk (Storage), plus a `mock`
  provider for offline development and tests.
- **WhatsApp demo client.** A thin channel that relays study material to the engine
  and returns audio voice notes, holding zero generation logic. Includes a QR web
  page for pairing and a self-chat input for the live demo loop.
- **Admin (React + Vite).** A settings app and an institutional dashboard mockup
  (students, agents, channels, analytics).
- **Tooling.** Per-package Vitest suites and a repo-root aggregate `test` /
  `typecheck` runner, plus a Husky `pre-commit` hook that runs `typecheck` then
  `test` before each commit.

### Fixed

- Load `.env` before taking the config snapshot so the real providers (Claude,
  ElevenLabs) receive their API keys.

[Unreleased]: https://keepachangelog.com/en/1.1.0/
[0.1.0]: https://keepachangelog.com/en/1.1.0/
