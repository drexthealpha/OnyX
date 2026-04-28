declare module "@onyx/kernel/alarm-and-abort" {
  export enum AbortCode {
    TIMEOUT = "TIMEOUT",
    PANIC = "PANIC",
    LAW_VIOLATION = "LAW_VIOLATION",
  }
  export function abort(code: AbortCode | string, reason?: string): never;
}