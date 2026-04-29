/**
 * Parse a PPTX file.
 * Each slide → ## Slide N: {title} heading + bullet points for text content.
 * Uses JSZip to unzip the OOXML and xml2js to parse slide XML.
 */
export declare function parse(filePath: string): Promise<string>;
//# sourceMappingURL=pptx.d.ts.map