import path from "path";

interface WorkBook {
  SheetNames: string[];
  Sheets: Record<string, unknown>;
}

async function getXlsx() {
  const mod = await import("xlsx");
  return mod.default ?? mod;
}

/**
 * Convert a 2D array of cell values into a Markdown table.
 * First row = header; separated by dashes; empty cells = empty string.
 */
function toMarkdownTable(rows: unknown[][]): string {
  if (rows.length === 0) return "";

  // Normalize cells to strings, treating null/undefined as ""
  const normalised: string[][] = rows.map((row) =>
    row.map((cell) => {
      if (cell === null || cell === undefined) return "";
      return String(cell).replace(/\|/g, "\\|").replace(/\n/g, " ");
    })
  );

  // Determine column count (max across all rows)
  const colCount = Math.max(...normalised.map((r) => r.length));

  // Pad rows to same length
  const padded = normalised.map((row) => {
    const copy = [...row];
    while (copy.length < colCount) copy.push("");
    return copy;
  });

  // Column widths
  const widths: number[] = Array.from({ length: colCount }, (_, i) =>
    Math.max(3, ...padded.map((r) => (r[i] ?? "").length))
  );

  const fmt = (row: string[]) =>
    "| " + row.map((cell, i) => cell.padEnd(widths[i])).join(" | ") + " |";

  const separator =
    "| " + widths.map((w) => "-".repeat(w)).join(" | ") + " |";

  const [header, ...dataRows] = padded;
  const lines = [fmt(header!), separator, ...dataRows.map(fmt)];
  return lines.join("\n");
}

/**
 * Parse an XLSX or XLS file.
 * Each worksheet → H2 heading + Markdown table with header-row separator.
 * Handles empty cells as empty string.
 */
export async function parse(filePath: string): Promise<string> {
  const XLSX = await getXlsx();

  let workbook: WorkBook;
  try {
    workbook = XLSX.readFile(filePath, { cellDates: true, raw: false }) as WorkBook;
  } catch (err) {
    throw new Error(`XLSX parsing failed for "${path.basename(filePath)}": ${String(err)}`);
  }

  const parts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to array of arrays (header row included)
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    }) as unknown[][];

    parts.push(`## ${sheetName}`);

    if (rows.length === 0) {
      parts.push("_Empty sheet_");
    } else {
      parts.push(toMarkdownTable(rows));
    }
  }

  return parts.join("\n\n").trim();
}