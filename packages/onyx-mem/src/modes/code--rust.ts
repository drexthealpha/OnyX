// ─────────────────────────────────────────────
// onyx-mem · modes/code--rust.ts
// Rust domain hints
// ─────────────────────────────────────────────

export const codeRustHints = `
Domain: Rust
Extra extraction rules:
- Capture lifetime decisions and ownership patterns resolved.
- Record crate choices (tokio, rayon, serde, etc.) with justification.
- Note unsafe blocks introduced and the safety invariant stated.
- Capture error handling strategy (thiserror, anyhow, custom enums).
- Flag 'unwrap()' and 'expect()' in non-test code as errors.
`.trim();