// pdf-parse ships no type declarations for its internal subpath entry.
// We import the lib subpath directly to dodge the upstream debug-file bug
// (the package root tries to read a local test PDF at require time).
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    text: string;
    version: string;
  }
  function pdfParse(
    dataBuffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<PDFParseResult>;
  export default pdfParse;
}
