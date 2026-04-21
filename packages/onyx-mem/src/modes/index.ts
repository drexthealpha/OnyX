// ─────────────────────────────────────────────
// onyx-mem · modes/index.ts
// Maps MemoryMode → compression hint string
// ─────────────────────────────────────────────

import type { MemoryMode } from '../types.js';
import { codeTsHints } from './code--ts.js';
import { codePyHints } from './code--py.js';
import { codeRustHints } from './code--rust.js';
import { financeHints } from './finance.js';
import { researchHints } from './research.js';
import { tradingHints } from './trading.js';

const MODE_HINTS: Record<MemoryMode, string> = {
  'code--ts': codeTsHints,
  'code--py': codePyHints,
  'code--rust': codeRustHints,
  finance: financeHints,
  research: researchHints,
  trading: tradingHints,
};

/**
 * Return the domain-specific compression hint for a given mode.
 */
export function getModeHints(mode: MemoryMode): string {
  return MODE_HINTS[mode] ?? '';
}