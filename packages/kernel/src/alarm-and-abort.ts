export enum AbortCode {
  TIMEOUT = "TIMEOUT",
  PANIC = "PANIC",
  LAW_VIOLATION = "LAW_VIOLATION",
}

export function abort(code: AbortCode | string, reason?: string): never {
  console.error(`[kernel] ABORT ${code}${reason ? `: ${reason}` : ""}`);
  process.exit(1);
}