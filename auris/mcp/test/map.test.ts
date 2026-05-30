import { describe, expect, it } from "vitest";

import {
  engineErrorToResult,
  envelopeToContent,
  type GenerateEnvelope,
} from "../src/map";

describe("envelopeToContent", () => {
  it("formats script, audio, duration, and a quiz", () => {
    const envelope: GenerateEnvelope = {
      script: "Hoy repasamos la fotosíntesis.",
      audioUrl: "http://localhost:3000/audio/abc.mp3",
      durationSec: 123,
      quiz: { question: "¿Qué produce la fotosíntesis?", answer: "Glucosa y oxígeno." },
    };

    const result = envelopeToContent(envelope);

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe(
      [
        "Script:",
        "Hoy repasamos la fotosíntesis.",
        "",
        "Audio: http://localhost:3000/audio/abc.mp3  (durationSec: 123)",
        "Quiz: ¿Qué produce la fotosíntesis? → Glucosa y oxígeno.",
      ].join("\n"),
    );
  });

  it("renders 'Quiz: (off)' when quiz is null", () => {
    const envelope: GenerateEnvelope = {
      script: "Lección sin quiz.",
      audioUrl: "http://localhost:3000/audio/xyz.mp3",
      durationSec: 60,
      quiz: null,
    };

    const result = envelopeToContent(envelope);

    expect(result.content[0].text).toBe(
      [
        "Script:",
        "Lección sin quiz.",
        "",
        "Audio: http://localhost:3000/audio/xyz.mp3  (durationSec: 60)",
        "Quiz: (off)",
      ].join("\n"),
    );
  });
});

describe("engineErrorToResult", () => {
  it("surfaces UNSUPPORTED_FILE with its message", () => {
    const result = engineErrorToResult("UNSUPPORTED_FILE", "Only PDF or text.");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("UNSUPPORTED_FILE: Only PDF or text.");
  });

  it("surfaces EXTRACTION_FAILED with its message", () => {
    const result = engineErrorToResult("EXTRACTION_FAILED", "Could not read file.");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("EXTRACTION_FAILED: Could not read file.");
  });

  it("surfaces PROVIDER_FAILED with its message", () => {
    const result = engineErrorToResult("PROVIDER_FAILED", "LLM provider error.");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("PROVIDER_FAILED: LLM provider error.");
  });

  it("surfaces TIMEOUT with its message", () => {
    const result = engineErrorToResult("TIMEOUT", "Took too long.");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("TIMEOUT: Took too long.");
  });

  it("falls back to a generic line for an unknown code", () => {
    const result = engineErrorToResult("SOMETHING_ELSE", "weird failure");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("generation failed: weird failure");
  });

  it("falls back to a bare generic line when code and message are missing", () => {
    const result = engineErrorToResult(undefined, undefined);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("generation failed");
  });

  it("emits a known code alone when its message is empty", () => {
    const result = engineErrorToResult("TIMEOUT", "   ");
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("TIMEOUT");
  });
});
