// ─── Reporter node — final report formatting ─────────────────────────────────
// Combines synthesis + citations into a polished markdown report.
// Strips reflector comments. Adds metadata header and references section.

import type { ResearchState } from "./types.js";
import { toMarkdownReport } from "./outputs/markdown.js";

export async function report(state: ResearchState): Promise<ResearchState> {
  const finalReport = toMarkdownReport(state);
  return { ...state, report: finalReport };
}