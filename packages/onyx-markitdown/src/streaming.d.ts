import { Readable } from "stream";
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
export declare function convertStream(readable: Readable, mimeType: string): AsyncIterable<string>;
//# sourceMappingURL=streaming.d.ts.map