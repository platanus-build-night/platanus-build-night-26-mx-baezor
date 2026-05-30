import type { Duration, Focus, GenerationOptions, Level, Tone } from "./types";

/**
 * ENGINE-OWNED prompt assembly. Swapping the LLM must NEVER lose this prompt —
 * providers receive the assembled system+user text and are dumb transports.
 *
 * Composes the final prompt from:
 *  - the editable systemPrompt template (default or "Avanzado" raw override),
 *  - the natural-language controls (tone / focus / level / duration / quiz),
 *  - the extracted study material as the user turn.
 */

const DEFAULT_SYSTEM_PROMPT =
  "Eres Auris, un tutor de audio en español que convierte material de estudio " +
  "en una sesión de estudio hablada, cálida y cercana, pensada para escuchar " +
  "durante un trayecto. Habla en segunda persona, como un buen profesor que " +
  "acompaña. El texto será leído por una voz sintética, así que escribe solo lo " +
  "que debe sonar: nada de encabezados, asteriscos, markdown ni acotaciones. " +
  "Todo el guion va en español.";

const TONE_GUIDE: Record<Tone, string> = {
  formal:
    "Usa un tono formal y respetuoso, con un trato de usted, claro y profesional.",
  casual:
    "Usa un tono casual y cercano, con un trato de tú, relajado y motivador.",
};

const FOCUS_GUIDE: Record<Focus, string> = {
  repaso:
    "El enfoque es de repaso general: prioriza comprender y afianzar las ideas principales.",
  examen:
    "El enfoque es de preparación para examen: resalta lo más evaluable, definiciones y posibles preguntas clave.",
};

const LEVEL_GUIDE: Record<Level, string> = {
  principiante:
    "El nivel es principiante: explica desde lo básico, define los términos y evita dar cosas por sabidas.",
  avanzado:
    "El nivel es avanzado: ve al grano, asume base previa y profundiza en los matices importantes.",
};

const DURATION_GUIDE: Record<Duration, { words: number; minutes: string }> = {
  corto: { words: 300, minutes: "unos 2 minutos" },
  medio: { words: 600, minutes: "unos 4 minutos" },
};

export interface AssembledPrompt {
  system: string;
  user: string;
}

export function assemblePrompt(
  material: string,
  options: GenerationOptions
): AssembledPrompt {
  const base =
    options.systemPrompt && options.systemPrompt.trim().length > 0
      ? options.systemPrompt.trim()
      : DEFAULT_SYSTEM_PROMPT;

  const dur = DURATION_GUIDE[options.duration] ?? DURATION_GUIDE.corto;

  const quizDirective = options.quiz
    ? "Incluye exactamente UN momento de quiz hablado dentro del guion: plantea " +
      "una pregunta clara sobre lo más importante, invita a pensar y deja una " +
      "pausa hablada (por ejemplo: 'Tómate un momento para pensarlo...'), y " +
      "después revela y explica la respuesta correcta. La pregunta y la respuesta " +
      "deben ir narradas dentro del guion (inline), no como una sección aparte. " +
      "Además, devuelve la pregunta y la respuesta también en el campo estructurado 'quiz'."
    : "NO incluyas ningún quiz, pregunta de repaso ni momento de evaluación. " +
      "El campo estructurado 'quiz' debe ser null.";

  const directives = [
    base,
    "",
    "Ajustes de esta generación:",
    `- ${TONE_GUIDE[options.tone] ?? TONE_GUIDE.casual}`,
    `- ${FOCUS_GUIDE[options.focus] ?? FOCUS_GUIDE.repaso}`,
    `- ${LEVEL_GUIDE[options.level] ?? LEVEL_GUIDE.principiante}`,
    `- Duración objetivo: ${dur.minutes}, alrededor de ${dur.words} palabras. Ajusta la extensión a esa meta.`,
    `- ${quizDirective}`,
    "",
    "Reglas de formato de salida: escribe únicamente el guion hablado en español, " +
      "en texto corrido y natural para ser leído por una voz sintética. No uses " +
      "markdown, viñetas, encabezados, asteriscos ni acotaciones entre paréntesis.",
  ].join("\n");

  const user =
    "Crea la sesión de estudio en audio a partir del siguiente material de estudio:\n\n" +
    "---\n" +
    material +
    "\n---";

  return { system: directives, user };
}
