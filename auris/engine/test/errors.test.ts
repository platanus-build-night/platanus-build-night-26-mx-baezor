import { describe, expect, it } from "vitest";
import { AppError, statusForCode } from "../src/errors";
import type { ErrorCode } from "../src/types";

const cases: Array<[ErrorCode, number]> = [
  ["UNSUPPORTED_FILE", 400],
  ["EXTRACTION_FAILED", 422],
  ["PROVIDER_FAILED", 502],
  ["TIMEOUT", 504],
];

describe("AppError", () => {
  it.each(cases)("maps %s to HTTP status %i", (code, status) => {
    const err = new AppError(code, "boom");
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("boom");
  });

  it.each(cases)("statusForCode(%s) === %i", (code, status) => {
    expect(statusForCode(code)).toBe(status);
  });
});
