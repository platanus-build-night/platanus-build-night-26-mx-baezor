import { describe, expect, it } from "vitest";
import {
  ACK,
  GENERIC_FALLBACK,
  copyForErrorCode,
  isBotCopy,
} from "../src/messages";

describe("copyForErrorCode", () => {
  it("maps UNSUPPORTED_FILE to its exact Spanish copy", () => {
    expect(copyForErrorCode("UNSUPPORTED_FILE")).toBe(
      "Solo puedo leer PDF o texto por ahora.",
    );
  });

  it("maps EXTRACTION_FAILED to its exact Spanish copy", () => {
    expect(copyForErrorCode("EXTRACTION_FAILED")).toBe(
      "No pude leer ese archivo, ¿puedes reenviarlo?",
    );
  });

  it("maps PROVIDER_FAILED to its exact Spanish copy", () => {
    expect(copyForErrorCode("PROVIDER_FAILED")).toBe(
      "Algo falló generando tu audio, intenta de nuevo.",
    );
  });

  it("maps TIMEOUT to its exact Spanish copy", () => {
    expect(copyForErrorCode("TIMEOUT")).toBe(
      "Tardó demasiado, intenta con menos material.",
    );
  });

  it("falls back to GENERIC_FALLBACK for an unknown code", () => {
    expect(copyForErrorCode("SOMETHING_ELSE")).toBe(GENERIC_FALLBACK);
  });

  it("falls back to GENERIC_FALLBACK for undefined", () => {
    expect(copyForErrorCode(undefined)).toBe(GENERIC_FALLBACK);
  });
});

describe("isBotCopy", () => {
  it("returns true for the ACK string", () => {
    expect(isBotCopy(ACK)).toBe(true);
  });

  it("returns true for GENERIC_FALLBACK", () => {
    expect(isBotCopy(GENERIC_FALLBACK)).toBe(true);
  });

  it("returns true for each mapped error copy", () => {
    expect(isBotCopy(copyForErrorCode("UNSUPPORTED_FILE"))).toBe(true);
    expect(isBotCopy(copyForErrorCode("EXTRACTION_FAILED"))).toBe(true);
    expect(isBotCopy(copyForErrorCode("PROVIDER_FAILED"))).toBe(true);
    expect(isBotCopy(copyForErrorCode("TIMEOUT"))).toBe(true);
  });

  it("returns false for arbitrary user text", () => {
    expect(isBotCopy("hola, quiero un audio")).toBe(false);
  });
});
