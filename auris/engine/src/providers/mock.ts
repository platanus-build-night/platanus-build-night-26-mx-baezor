import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type {
  GenerationOptions,
  LLMProvider,
  Quiz,
  TTSProvider,
  VoiceOptions,
} from "../types";

/**
 * MockLLMProvider — no API key needed. Returns a believable Spanish study
 * script with an inline quiz beat, honoring options.quiz. This (plus MockTTS)
 * is the real demonstration of the "drop a file + register one line" value
 * prop: it lets the whole pipeline run without external providers.
 */
export class MockLLMProvider implements LLMProvider {
  async generateScript(
    text: string,
    options: GenerationOptions
  ): Promise<{ script: string; quiz: Quiz | null }> {
    const snippet = text.trim().slice(0, 140).replace(/\s+/g, " ");
    const lead = snippet.length > 0 ? snippet : "el material que me compartiste";

    const quizOn = options.quiz;
    const quiz: Quiz | null = quizOn
      ? {
          question:
            "¿Cuál es la idea principal que acabamos de repasar y por qué importa?",
          answer:
            "La idea central del material es el concepto clave que explicamos: comprenderlo te permite conectar el resto de los detalles y aplicarlo cuando lo necesites.",
        }
      : null;

    const quizBeat = quizOn
      ? "Antes de cerrar, una pregunta para ti: ¿cuál dirías que es la idea " +
        "principal de todo esto y por qué importa? Tómate un momento para " +
        "pensarlo... Muy bien. La idea central es justo el concepto clave que " +
        "explicamos: cuando lo entiendes, todos los demás detalles encajan a su " +
        "alrededor y puedes aplicarlo cuando lo necesites. "
      : "";

    const script =
      `Hola, soy Auris y vamos a repasar juntos. Hoy trabajamos sobre esto: ` +
      `${lead}. Déjame explicártelo de forma sencilla, como si fuéramos caminando ` +
      `y te lo contara con calma. Lo más importante aquí es entender la idea de ` +
      `fondo antes que memorizar los detalles: cuando captas el porqué, lo demás ` +
      `se acomoda solo. Vamos paso a paso, conectando cada parte con un ejemplo ` +
      `cercano para que se quede contigo. ` +
      quizBeat +
      `Y con eso lo tienes. Quédate con la idea clave y repásala una vez más ` +
      `cuando llegues. Nos escuchamos en el próximo repaso.`;

    return { script, quiz };
  }
}

/**
 * MockTTSProvider — produces a REAL short mp3 by shelling to ffmpeg (a 2s sine
 * tone). Falls back to a minimal valid mp3 frame buffer if ffmpeg is missing,
 * so the pipeline still returns bytes. Synthesizes ONLY the script.
 */
export class MockTTSProvider implements TTSProvider {
  async synthesize(_script: string, _options: VoiceOptions): Promise<Buffer> {
    const tmp = path.join(
      os.tmpdir(),
      `auris-mock-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`
    );
    try {
      const res = spawnSync(
        "ffmpeg",
        [
          "-hide_banner",
          "-loglevel",
          "error",
          "-f",
          "lavfi",
          "-i",
          "sine=frequency=440:duration=2",
          "-q:a",
          "9",
          "-y",
          tmp,
        ],
        { stdio: "ignore" }
      );
      if (res.status === 0 && fs.existsSync(tmp)) {
        const buf = fs.readFileSync(tmp);
        if (buf.length > 0) return buf;
      }
    } catch {
      // fall through to the minimal buffer
    } finally {
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {
        /* ignore cleanup errors */
      }
    }
    return minimalSilentMp3();
  }
}

/**
 * A tiny but structurally valid MPEG-1 Layer III buffer (a handful of silent
 * frames). Used only when ffmpeg is unavailable so the pipeline still yields
 * playable bytes. ~13 KB.
 */
function minimalSilentMp3(): Buffer {
  // MPEG-1 Layer III, 128 kbps, 44100 Hz, mono frame header: FF FB 90 64.
  // Frame size for these params = 417 bytes (incl. header). Body = zeros.
  const header = Buffer.from([0xff, 0xfb, 0x90, 0x64]);
  const frameSize = 417;
  const body = Buffer.alloc(frameSize - header.length, 0x00);
  const frame = Buffer.concat([header, body]);
  const frames: Buffer[] = [];
  for (let i = 0; i < 32; i++) frames.push(frame); // ~0.85s of silent frames
  return Buffer.concat(frames);
}
