/**
 * onyx-markitdown test suite
 * Run with: bun test src/tests/markitdown.test.ts
 *
 * 3 tests (minimum required):
 * 1. HTML parser removes script tags and returns non-empty markdown
 * 2. XLSX parser returns string containing | (markdown table pipes)
 * 3. Unknown extension throws UnsupportedFileType with the extension in message
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import os from "os";

// ─── Test 1: HTML parser removes script tags ─────────────────────────────────

describe("HTML Parser", () => {
  it("removes script tags and returns non-empty markdown", async () => {
    const { parseHtmlString } = await import("../parsers/html.js");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            alert("this should be removed");
            const x = 42;
          </script>
          <style>body { color: red; }</style>
        </head>
        <body>
          <nav><a href="/">Home</a></nav>
          <header><h1>Site Header</h1></header>
          <main>
            <h2>Article Title</h2>
            <p>This is the main content of the article. It should appear in the output.</p>
            <ul>
              <li>First item</li>
              <li>Second item</li>
            </ul>
          </main>
          <footer>Footer content</footer>
        </body>
      </html>
    `;

    const result = await parseHtmlString(html);

    // Must be non-empty
    expect(result.length).toBeGreaterThan(0);

    // Must not contain script content
    expect(result).not.toContain("alert");
    expect(result).not.toContain("const x = 42");

    // Must not contain style content
    expect(result).not.toContain("color: red");

    // Must contain main article content
    expect(result).toContain("Article Title");
    expect(result).toContain("main content");
  });
});

// ─── Test 2: XLSX parser returns markdown table (contains |) ─────────────────

describe("XLSX Parser", () => {
  let tmpXlsxPath: string;

  beforeAll(async () => {
    // Create a minimal XLSX file in-memory using the xlsx package
    const XLSX = await import("xlsx").then((m) => m.default ?? m);

    const wb = XLSX.utils.book_new();
    const data = [
      ["Name", "Score", "Grade"],
      ["Alice", 95, "A"],
      ["Bob", 82, "B"],
      ["Carol", 78, "C"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Results");

    tmpXlsxPath = path.join(os.tmpdir(), `test-onyx-${Date.now()}.xlsx`);
    XLSX.writeFile(wb, tmpXlsxPath);
  });

  afterAll(() => {
    if (fs.existsSync(tmpXlsxPath)) {
      fs.unlinkSync(tmpXlsxPath);
    }
  });

  it("returns a string containing | (markdown table pipes)", async () => {
    const { parse } = await import("../parsers/xlsx.js");
    const result = await parse(tmpXlsxPath);

    // Must contain pipe characters (markdown table)
    expect(result).toContain("|");

    // Must contain the sheet heading
    expect(result).toContain("## Results");

    // Must contain header row data
    expect(result).toContain("Name");
    expect(result).toContain("Score");
    expect(result).toContain("Grade");

    // Must contain data rows
    expect(result).toContain("Alice");
    expect(result).toContain("95");
  });
});

// ─── Test 3: Unknown extension throws UnsupportedFileType ────────────────────

describe("convert()", () => {
  it("throws UnsupportedFileType with extension in message for unknown extension", async () => {
    const { convert, UnsupportedFileType } = await import("../index.js");

    const unknownExt = ".xyz";
    const fakePath = `/tmp/some-random-file${unknownExt}`;

    let caughtError: unknown = null;
    try {
      await convert(fakePath);
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError).toBeInstanceOf(UnsupportedFileType);

    const err = caughtError as UnsupportedFileType;
    // The extension must appear in the error message
    expect(err.message).toContain(unknownExt);
    expect(err.name).toBe("UnsupportedFileType");
  });
});