// ─────────────────────────────────────────────
// onyx-mem · modes/code--ts.ts
// TypeScript / Node.js / Bun domain hints
// ─────────────────────────────────────────────

/**
 * Extra instructions appended to the compression prompt when mode = 'code--ts'.
 * Focus on TypeScript-specific signal: types, package choices, config decisions.
 */
export const codeTsHints = `
Domain: TypeScript / Node.js / Bun
Extra extraction rules:
- Capture type definitions introduced or modified (interface names, key fields).
- Note package manager choices (bun vs npm vs pnpm) and why.
- Record tsconfig flags that were changed and the reason.
- Flag any 'as unknown as X' casts or @ts-ignore patterns as errors.
- Capture module resolution decisions (ESM vs CJS, bundler vs node16).
`.trim();