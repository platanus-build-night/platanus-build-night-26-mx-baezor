import { config } from "../config";
import { AppError } from "../errors";
import type { TTSProvider, VoiceOptions } from "../types";

/**
 * ElevenLabsProvider — single TTS call, NO chunking. Synthesizes ONLY the
 * script. Uses global fetch (Node 24). Any error -> PROVIDER_FAILED.
 */
export class ElevenLabsProvider implements TTSProvider {
  async synthesize(script: string, options: VoiceOptions): Promise<Buffer> {
    const apiKey = config.ELEVENLABS_API_KEY;
    const voiceId = options.voiceId ?? config.ELEVENLABS_VOICE_ID;
    const model = options.model ?? config.ELEVENLABS_MODEL;

    if (!apiKey) {
      throw new AppError(
        "PROVIDER_FAILED",
        "ELEVENLABS_API_KEY no está configurada."
      );
    }
    if (!voiceId) {
      throw new AppError(
        "PROVIDER_FAILED",
        "ELEVENLABS_VOICE_ID no está configurado."
      );
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: script,
          model_id: model,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        throw new AppError(
          "PROVIDER_FAILED",
          `ElevenLabs error ${res.status}: ${detail.slice(0, 500)}`
        );
      }

      const arrayBuffer = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      if (buf.length === 0) {
        throw new AppError(
          "PROVIDER_FAILED",
          "ElevenLabs devolvió un audio vacío."
        );
      }
      return buf;
    } catch (err) {
      if (err instanceof AppError) throw err;
      const detail = err instanceof Error ? err.message : String(err);
      throw new AppError("PROVIDER_FAILED", `ElevenLabs API error: ${detail}`);
    }
  }
}
