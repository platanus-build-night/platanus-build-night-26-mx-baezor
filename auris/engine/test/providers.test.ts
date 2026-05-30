import { describe, expect, it } from "vitest";
import { getLLMProvider, getTTSProvider } from "../src/providers";
import { MockLLMProvider, MockTTSProvider } from "../src/providers/mock";
import type { GenerationOptions, VoiceOptions } from "../src/types";

const options: GenerationOptions = {
  tone: "casual",
  focus: "repaso",
  level: "principiante",
  duration: "corto",
  quiz: true,
};

describe("provider factory", () => {
  it("returns the mock LLM provider for \"mock\"", () => {
    expect(getLLMProvider("mock")).toBeInstanceOf(MockLLMProvider);
  });

  it("returns the mock TTS provider for \"mock\"", () => {
    expect(getTTSProvider("mock")).toBeInstanceOf(MockTTSProvider);
  });

  it("throws on an unknown LLM provider name", () => {
    expect(() => getLLMProvider("does-not-exist")).toThrow(/Unknown LLM_PROVIDER/);
  });

  it("throws on an unknown TTS provider name", () => {
    expect(() => getTTSProvider("does-not-exist")).toThrow(/Unknown TTS_PROVIDER/);
  });
});

describe("MockLLMProvider.generateScript", () => {
  it("returns a script and a quiz when quiz is on", async () => {
    const llm = new MockLLMProvider();
    const { script, quiz } = await llm.generateScript("texto", {
      ...options,
      quiz: true,
    });
    expect(typeof script).toBe("string");
    expect(script.length).toBeGreaterThan(0);
    expect(quiz).not.toBeNull();
    expect(quiz?.question.length).toBeGreaterThan(0);
    expect(quiz?.answer.length).toBeGreaterThan(0);
  });

  it("returns a null quiz when quiz is off", async () => {
    const llm = new MockLLMProvider();
    const { script, quiz } = await llm.generateScript("texto", {
      ...options,
      quiz: false,
    });
    expect(script.length).toBeGreaterThan(0);
    expect(quiz).toBeNull();
  });
});

describe("MockTTSProvider.synthesize", () => {
  it("returns a non-empty Buffer", async () => {
    const tts = new MockTTSProvider();
    const voice: VoiceOptions = { options };
    const audio = await tts.synthesize("hola, esto es una prueba", voice);
    expect(Buffer.isBuffer(audio)).toBe(true);
    expect(audio.length).toBeGreaterThan(0);
  });
});
