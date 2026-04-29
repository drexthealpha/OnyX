/**
 * Parse an HTML string or file content to clean prose Markdown.
 * Uses turndown with ATX headings and fenced code blocks.
 * Pre-processes: removes script, style, nav, footer, header elements.
 */
export declare function parseHtmlString(html: string): Promise<string>;
/**
 * Parse an HTML file at filePath to Markdown.
 */
export declare function parse(filePath: string): Promise<string>;
//# sourceMappingURL=html.d.ts.map