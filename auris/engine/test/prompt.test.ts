import { describe, expect, it } from "vitest";
import { assemblePrompt } from "../src/prompt";
import type { GenerationOptions } from "../src/types";

const base: GenerationOptions = {
  tone: "casual",
  focus: "repaso",
  level: "principiante",
  duration: "corto",
  quiz: true,
};

describe("assemblePrompt", () => {
  it("includes a quiz instruction when quiz is on", () => {
    const { system } = assemblePrompt("material", { ...base, quiz: true });
    expect(system).toContain("quiz");
    // The "on" branch instructs to include exactly one spoken quiz beat.
    expect(system).toContain("momento de quiz");
    expect(system).not.toContain("NO incluyas ningún quiz");
  });

  it("omits the quiz instruction when quiz is off", () => {
    const { system } = assemblePrompt("material", { ...base, quiz: false });
    expect(system).toContain("NO incluyas ningún quiz");
    expect(system).toContain("debe ser null");
    expect(system).not.toContain("momento de quiz");
  });

  it("reflects the tone (formal vs casual)", () => {
    const formal = assemblePrompt("material", { ...base, tone: "formal" }).system;
    expect(formal).toContain("tono formal");

    const casual = assemblePrompt("material", { ...base, tone: "casual" }).system;
    expect(casual).toContain("tono casual");
  });

  it("reflects the target duration", () => {
    const corto = assemblePrompt("material", { ...base, duration: "corto" }).system;
    expect(corto).toContain("300 palabras");

    const medio = assemblePrompt("material", { ...base, duration: "medio" }).system;
    expect(medio).toContain("600 palabras");
  });

  it("places the material in the user turn", () => {
    const { user } = assemblePrompt("MI MATERIAL DE ESTUDIO", base);
    expect(user).toContain("MI MATERIAL DE ESTUDIO");
  });
});
