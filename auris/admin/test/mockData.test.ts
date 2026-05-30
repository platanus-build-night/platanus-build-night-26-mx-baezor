import { describe, it, expect } from "vitest";
import { SECTIONS, ESTUDIANTES } from "../src/mockData.ts";

describe("mockData", () => {
  it("SECTIONS has the 6 expected ids in order", () => {
    expect(SECTIONS.map((s) => s.id)).toEqual([
      "inicio",
      "estudiantes",
      "agentes",
      "canales",
      "analitica",
      "ajustes",
    ]);
  });

  it("ESTUDIANTES is non-empty", () => {
    expect(ESTUDIANTES.length).toBeGreaterThan(0);
  });
});
