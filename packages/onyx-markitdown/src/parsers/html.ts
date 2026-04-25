// @ts-ignore — turndown has types via @types/turndown
import TurndownService from "turndown";

/**
 * Remove unwanted elements from an HTML string before converting to Markdown.
 * Strips: <script>, <style>, <nav>, <footer>, <header>
 */
function preProcessHtml(html: string): string {
  // Remove script tags and their content
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  // Remove nav elements
  cleaned = cleaned.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "");
  // Remove footer elements
  cleaned = cleaned.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");
  // Remove header elements
  cleaned = cleaned.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "");
  return cleaned;
}

/**
 * Parse an HTML string or file content to clean prose Markdown.
 * Uses turndown with ATX headings and fenced code blocks.
 * Pre-processes: removes script, style, nav, footer, header elements.
 */
export async function parseHtmlString(html: string): Promise<string> {
  const cleaned = preProcessHtml(html);

  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    strongDelimiter: "**",
    emDelimiter: "_",
    hr: "---",
  });

  // Remove HTML comments
  td.addRule("removeComments", {
    filter: (node: Node) => node.nodeType === 8, // Node.COMMENT_NODE
    replacement: () => "",
  });

  // Keep relative links but strip mailto/javascript schemes
  td.addRule("cleanLinks", {
    filter: "a",
    replacement: (content: string, node: Node) => {
      const el = node as HTMLAnchorElement;
      const href = el.getAttribute("href") ?? "";
      if (href.startsWith("javascript:") || href.startsWith("mailto:")) {
        return content;
      }
      if (!href || href === "#") return content;
      const title = el.getAttribute("title");
      return title ? `[${content}](${href} "${title}")` : `[${content}](${href})`;
    },
  });

  let md = td.turndown(cleaned);

  // Collapse 3+ blank lines to 2
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim();
}

import fs from "fs";
import path from "path";

/**
 * Parse an HTML file at filePath to Markdown.
 */
export async function parse(filePath: string): Promise<string> {
  let html: string;
  try {
    html = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    throw new Error(`HTML parsing failed for "${path.basename(filePath)}": ${String(err)}`);
  }
  return parseHtmlString(html);
}