export declare class UnsupportedFileType extends Error {
    constructor(ext: string);
}
export interface ParseResult {
    markdown: string;
    metadata: Record<string, unknown>;
}
export type SupportedMimeType = "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | "application/vnd.ms-excel" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "text/html" | "image/png" | "image/jpeg" | "image/webp" | "image/gif";
export type SupportedExtension = ".pdf" | ".docx" | ".xlsx" | ".xls" | ".pptx" | ".html" | ".htm" | ".png" | ".jpg" | ".jpeg" | ".webp" | ".gif";
//# sourceMappingURL=types.d.ts.map