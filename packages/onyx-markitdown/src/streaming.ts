import { Readable } from "stream";
import { tmpdir } from "os";
import { createWriteStream, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";
import { UnsupportedFileType } from "./types.js";

// Map MIME types to file extensions for temp file naming
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/html": ".html",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Buffer a readable stream to a temporary file, run the appropriate parser,
 * and yield markdown progressively.
 *
 * For PDF: yields one chunk per "page" (heuristic: split on form-feeds or double-newlines after long blocks).
 * For XLSX: yields one chunk per worksheet (## heading + table).
 * For all others: yields the full markdown as a single chunk.
 *
 * The temp file is deleted after parsing completes or on error.
 *
 * @param readable - Node.js Readable stream of the document bytes
 * @param mimeType - MIME type to select the correct parser
 */
export async function* convertStream(
  readable: Readable,
  mimeType: string
): AsyncIterable<string> {
  const ext = MIME_TO_EXT[mimeType.toLowerCase().split(";")[0]!.trim()];
  if (!ext) {
    throw new UnsupportedFileType(mimeType);
  }

  // Write stream to temp file
  const tmpPath = join(tmpdir(), `onyx-md-${randomBytes(8).toString("hex")}${ext}`);

  await new Promise<void>((resolve, reject) => {
    const writer = createWriteStream(tmpPath);
    readable.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
    readable.on("error", reject);
  });

  try {
    if (ext === ".pdf") {
      // Stream PDF page-by-page (heuristic split)
      const { parse } = await import("./parsers/pdf.js");
      const fullMd = await parse(tmpPath);
      // Heuristic: split on lines that look like page breaks
      // (double newline before a heading = new page unit)
      const pageChunks = fullMd
        .split(/\n(?=#{1,2} )/)
        .map((c) => c.trim())
        .filter(Boolean);

      if (pageChunks.length === 0) {
        yield fullMd;
      } else {
        for (const chunk of pageChunks) {
          yield chunk + "\n\n";
        }
      }
    } else if (ext === ".xlsx" || ext === ".xls") {
      // Stream XLSX sheet-by-sheet
      const { parse } = await import("./parsers/xlsx.js");
      const fullMd = await parse(tmpPath);
      // Split on ## headings (each worksheet)
      const sheetChunks = fullMd
        .split(/\n(?=## )/)
        .map((c) => c.trim())
        .filter(Boolean);

      if (sheetChunks.length === 0) {
        yield fullMd;
      } else {
        for (const chunk of sheetChunks) {
          yield chunk + "\n\n";
        }
      }
    } else {
      // All other types: parse fully, yield as one chunk
      const { convert } = await import("./index.js");
      const md = await convert(tmpPath);
      yield md;
    }
  } finally {
    if (existsSync(tmpPath)) {
      try {
        unlinkSync(tmpPath);
      } catch {
        // best-effort cleanup
      }
    }
  }
}