import path from "path";

async function getMammoth() {
  const mod = await import("mammoth");
  return mod.default ?? mod;
}

/**
 * Convert a DOCX file to Markdown using mammoth.
 * mammoth.convertToMarkdown preserves H1/H2/H3 headings, lists, bold, italic, tables.
 */
export async function parse(filePath: string): Promise<string> {
  const mammoth = await getMammoth();

  let result: { value: string; messages: Array<{ message: string }> };
  try {
    result = await mammoth.convertToMarkdown({ path: filePath });
  } catch (err) {
    throw new Error(`DOCX parsing failed for "${path.basename(filePath)}": ${String(err)}`);
  }

  let md = result.value ?? "";

  // Normalize heading levels: ensure H1 > H2 > H3 hierarchy is clean
  // mammoth sometimes uses underline-style headings; convert to ATX
  md = md.replace(/^(.+)\n={3,}$/gm, "# $1");
  md = md.replace(/^(.+)\n-{3,}$/gm, "## $1");

  // Collapse excessive blank lines
  md = md.replace(/\n{3,}/g, "\n\n");

  return md.trim();
}