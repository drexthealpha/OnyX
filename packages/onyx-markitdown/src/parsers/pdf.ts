import fs from "fs";
import path from "path";

// pdf-parse is CommonJS; dynamic import handles ESM interop
async function getPdfParse() {
  // @ts-ignore
  const mod = await import("pdf-parse");
  return (mod.default ?? mod) as any;
}

/**
 * Heuristic: detect headings by SHORT lines that are followed by longer lines.
 * Lines shorter than 60 chars and not ending in punctuation are candidate headings.
 */
function detectHeadings(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      result.push("");
      continue;
    }

    const nextLine = lines[i + 1]?.trim() ?? "";
    const isShort = line.length > 0 && line.length < 60;
    const noTrailingPunct = !/[.,:;!?]$/.test(line);
    const nextIsLonger = nextLine.length > line.length;
    const isAllCaps = line === line.toUpperCase() && line.length > 3;
    const isNumberedSection = /^(\d+\.)+\s+\S/.test(line);

    if (isNumberedSection) {
      // e.g. "1.2 Introduction" → H2
      result.push(`## ${line}`);
    } else if (isAllCaps && isShort && noTrailingPunct) {
      // e.g. "INTRODUCTION" → H1
      result.push(`# ${line}`);
    } else if (isShort && noTrailingPunct && nextIsLonger && nextLine.length > 40) {
      // Short title line before a paragraph → H2
      result.push(`## ${line}`);
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * Merge MasterFormat-style partial numbering lines: ".1\nText" → ".1 Text"
 */
function mergePartialNumbering(text: string): string {
  return text.replace(/^(\.\d+)\n(.+)/gm, "$1 $2");
}

/**
 * Parse a PDF file and return well-structured Markdown.
 * Uses pdf-parse for text extraction, then applies heading heuristics.
 */
export async function parse(filePath: string): Promise<string> {
  const pdfParse = await getPdfParse();
  const buffer = fs.readFileSync(filePath);

  let data: { text: string; numpages: number; info: Record<string, unknown> };
  try {
    data = await pdfParse(buffer);
  } catch (err) {
    throw new Error(`PDF parsing failed for "${path.basename(filePath)}": ${String(err)}`);
  }

  let text = data.text ?? "";

  // Post-process
  text = mergePartialNumbering(text);
  text = detectHeadings(text);

  // Collapse 3+ blank lines to 2
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}