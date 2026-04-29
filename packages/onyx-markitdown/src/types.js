// ─── Error Types ────────────────────────────────────────────────────────────
export class UnsupportedFileType extends Error {
    constructor(ext) {
        super(`Unsupported file type: "${ext}". Supported: .pdf .docx .xlsx .xls .pptx .html .htm .png .jpg .jpeg .webp .gif`);
        this.name = "UnsupportedFileType";
    }
}
//# sourceMappingURL=types.js.map