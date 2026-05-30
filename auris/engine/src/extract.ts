// IMPORTANT: import the lib subpath directly to avoid pdf-parse's debug-file
// bug (the package root reads a local test PDF at require time).
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { config } from "./config";
import { AppError } from "./errors";

const PDF_MAGIC = Buffer.from("%PDF-", "ascii");

/** True if the buffer begins with the PDF magic bytes. */
function looksLikePdf(buf: Buffer): boolean {
  return buf.length >= PDF_MAGIC.length && buf.subarray(0, 5).equals(PDF_MAGIC);
}

/** Truncate extracted text to INPUT_CHAR_CAP characters. */
export function truncate(text: string): string {
  if (text.length <= config.INPUT_CHAR_CAP) return text;
  return text.slice(0, config.INPUT_CHAR_CAP);
}

/**
 * Extract usable text from an uploaded file buffer.
 *  - PDF  -> pdf-parse text. Unreadable/empty PDF -> EXTRACTION_FAILED.
 *  - Non-PDF binary -> UNSUPPORTED_FILE.
 * Result is truncated to INPUT_CHAR_CAP.
 */
export async function extractFromFile(
  buf: Buffer,
  mimetype?: string,
  originalName?: string
): Promise<string> {
  const isPdf =
    looksLikePdf(buf) ||
    mimetype === "application/pdf" ||
    (originalName ?? "").toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new AppError(
      "UNSUPPORTED_FILE",
      `Unsupported file type (mimetype=${mimetype ?? "unknown"}). Only PDF or text is supported.`
    );
  }

  // Must actually be PDF bytes to parse.
  if (!looksLikePdf(buf)) {
    throw new AppError(
      "EXTRACTION_FAILED",
      "File claims to be a PDF but does not start with the PDF magic bytes."
    );
  }

  let text: string;
  try {
    const result = await pdfParse(buf);
    text = (result.text ?? "").trim();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new AppError("EXTRACTION_FAILED", `Could not read the PDF: ${detail}`);
  }

  if (text.length === 0) {
    throw new AppError(
      "EXTRACTION_FAILED",
      "The PDF produced no extractable text (it may be scanned images)."
    );
  }

  return truncate(text);
}

/** Raw text input passes through (trimmed + truncated). */
export function extractFromText(text: string): string {
  return truncate(text.trim());
}
