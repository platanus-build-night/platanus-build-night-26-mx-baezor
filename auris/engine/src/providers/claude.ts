import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { AppError } from "../errors";
import { assemblePrompt } from "../prompt";
import type { GenerationOptions, LLMProvider, Quiz } from "../types";

/**
 * ClaudeProvider — uses @anthropic-ai/sdk with the model from ANTHROPIC_MODEL.
 * Returns STRUCTURED { script, quiz } via a forced tool call so the envelope's
 * quiz field never requires re-parsing the script. Any API error -> PROVIDER_FAILED.
 *
 * The engine OWNS prompt assembly (see ../prompt). This provider is a dumb
 * transport: it sends the assembled system+user prompt and shapes the result.
 */
export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;

  constructor() {
    // The SDK throws if no key; surface as PROVIDER_FAILED at call time instead
    // of crashing module load, so the engine still boots for other providers.
    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY ?? "",
    });
  }

  async generateScript(
    text: string,
    options: GenerationOptions
  ): Promise<{ script: string; quiz: Quiz | null }> {
    const { system, user } = assemblePrompt(text, options);

    try {
      const response = await this.client.messages.create({
        model: config.ANTHROPIC_MODEL,
        max_tokens: 2048,
        system,
        tool_choice: { type: "tool", name: "emit_study_session" },
        tools: [
          {
            name: "emit_study_session",
            description:
              "Devuelve el guion de estudio en español y, si aplica, el quiz estructurado.",
            input_schema: {
              type: "object",
              properties: {
                script: {
                  type: "string",
                  description:
                    "El guion completo en español, hablado, con el quiz narrado de forma inline cuando esté activado.",
                },
                quiz: {
                  type: ["object", "null"],
                  description:
                    "El quiz estructurado, o null si el quiz está desactivado.",
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                },
              },
              required: ["script", "quiz"],
            },
          },
        ],
        messages: [{ role: "user", content: user }],
      });

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );
      if (!toolUse) {
        throw new AppError(
          "PROVIDER_FAILED",
          "Claude no devolvió la salida estructurada esperada."
        );
      }

      const input = toolUse.input as {
        script?: unknown;
        quiz?: unknown;
      };

      const script =
        typeof input.script === "string" ? input.script.trim() : "";
      if (!script) {
        throw new AppError(
          "PROVIDER_FAILED",
          "Claude devolvió un guion vacío."
        );
      }

      const quiz = normalizeQuiz(input.quiz, options.quiz);
      return { script, quiz };
    } catch (err) {
      if (err instanceof AppError) throw err;
      const detail = err instanceof Error ? err.message : String(err);
      throw new AppError("PROVIDER_FAILED", `Claude API error: ${detail}`);
    }
  }
}

function normalizeQuiz(raw: unknown, quizOn: boolean): Quiz | null {
  if (!quizOn) return null;
  if (raw && typeof raw === "object") {
    const q = raw as { question?: unknown; answer?: unknown };
    if (typeof q.question === "string" && typeof q.answer === "string") {
      return { question: q.question, answer: q.answer };
    }
  }
  return null;
}
