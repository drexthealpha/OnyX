// ─── Error Types ────────────────────────────────────────────────────────────

export class UnsupportedFileType extends Error {
  constructor(ext: string) {
    super(`Unsupported file type: "${ext}". Supported: .pdf .docx .xlsx .xls .pptx .html .htm .png .jpg .jpeg .webp .gif`);
    this.name = "UnsupportedFileType";
  }
}

// ─── Result Types ────────────────────────────────────────────────────────────

export interface ParseResult {
  markdown: string;
  metadata: Record<string, unknown>;
}

// ─── Streaming ───────────────────────────────────────────────────────────────

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "text/html"
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif";

export type SupportedExtension =
  | ".pdf"
  | ".docx"
  | ".xlsx"
  | ".xls"
  | ".pptx"
  | ".html"
  | ".htm"
  | ".png"
  | ".jpg"
  | ".jpeg"
  | ".webp"
  | ".gif";