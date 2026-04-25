import path from "path";
import { UnsupportedFileType } from "./types.js";

// ─── Extension → Parser Map ──────────────────────────────────────────────────

type Parser = (filePath: string) => Promise<string>;

const PARSER_MAP: Record<string, () => Promise<Parser>> = {
  ".pdf":  () => import("./parsers/pdf.js").then((m) => m.parse),
  ".docx": () => import("./parsers/docx.js").then((m) => m.parse),
  ".xlsx": () => import("./parsers/xlsx.js").then((m) => m.parse),
  ".xls":  () => import("./parsers/xlsx.js").then((m) => m.parse),
  ".pptx": () => import("./parsers/pptx.js").then((m) => m.parse),
  ".html": () => import("./parsers/html.js").then((m) => m.parse),
  ".htm":  () => import("./parsers/html.js").then((m) => m.parse),
  ".png":  () => import("./parsers/image.js").then((m) => m.parse),
  ".jpg":  () => import("./parsers/image.js").then((m) => m.parse),
  ".jpeg": () => import("./parsers/image.js").then((m) => m.parse),
  ".webp": () => import("./parsers/image.js").then((m) => m.parse),
  ".gif":  () => import("./parsers/image.js").then((m) => m.parse),
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Convert any supported document to Markdown.
 * Extension detection is case-insensitive.
 *
 * @param filePath - Absolute or relative path to the file
 * @returns Markdown string
 * @throws UnsupportedFileType if the extension is not supported
 */
export async function convert(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  const loader = PARSER_MAP[ext];
  if (!loader) {
    throw new UnsupportedFileType(ext);
  }

  const parser = await loader();
  return parser(filePath);
}

// Re-export types
export { UnsupportedFileType } from "./types.js";
export type { ParseResult, SupportedExtension, SupportedMimeType } from "./types.js";

// Re-export streaming
export { convertStream } from "./streaming.js";