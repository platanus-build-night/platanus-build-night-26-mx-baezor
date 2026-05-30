import { describe, expect, it } from "vitest";
import { config } from "../src/config";
import { extractFromText, truncate } from "../src/extract";

describe("extractFromText", () => {
  it("passes short text through (trimmed)", () => {
    expect(extractFromText("  hola mundo  ")).toBe("hola mundo");
  });

  it("truncates to INPUT_CHAR_CAP", () => {
    // All non-whitespace so trim() does not shrink it below the cap.
    const long = "a".repeat(config.INPUT_CHAR_CAP + 1000);
    const out = extractFromText(long);
    expect(out.length).toBe(config.INPUT_CHAR_CAP);
  });
});

describe("truncate", () => {
  it("leaves text shorter than the cap untouched", () => {
    const short = "una linea corta";
    expect(truncate(short)).toBe(short);
  });

  it("caps text longer than the cap at INPUT_CHAR_CAP", () => {
    const long = "b".repeat(config.INPUT_CHAR_CAP + 1);
    expect(truncate(long).length).toBe(config.INPUT_CHAR_CAP);
  });
});
