import type { ErrorCode } from "./types";

/** Fixed code -> HTTP status mapping (contract authority). */
const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNSUPPORTED_FILE: 400,
  EXTRACTION_FAILED: 422,
  PROVIDER_FAILED: 502,
  TIMEOUT: 504,
};

/**
 * Engine error carrying one of the 4 machine codes. The HTTP layer renders it
 * as EXACTLY { error: { code, message } } with the mapped status.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function statusForCode(code: ErrorCode): number {
  return STATUS_BY_CODE[code];
}

/** The exact JSON error body shape. */
export function errorBody(code: ErrorCode, message: string) {
  return { error: { code, message } };
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
