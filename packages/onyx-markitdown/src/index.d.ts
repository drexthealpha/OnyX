/**
 * Convert any supported document to Markdown.
 * Extension detection is case-insensitive.
 *
 * @param filePath - Absolute or relative path to the file
 * @returns Markdown string
 * @throws UnsupportedFileType if the extension is not supported
 */
export declare function convert(filePath: string): Promise<string>;
export { UnsupportedFileType } from "./types.js";
export type { ParseResult, SupportedExtension, SupportedMimeType } from "./types.js";
export { convertStream } from "./streaming.js";
//# sourceMappingURL=index.d.ts.map