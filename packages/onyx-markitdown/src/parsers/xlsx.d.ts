/**
 * Parse an XLSX or XLS file.
 * Each worksheet → H2 heading + Markdown table with header-row separator.
 * Handles empty cells as empty string.
 */
export declare function parse(filePath: string): Promise<string>;
//# sourceMappingURL=xlsx.d.ts.map