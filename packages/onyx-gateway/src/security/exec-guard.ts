import { isCommandAllowed } from "./allowlist.js";

export class ExecDeniedError extends Error {
  constructor(cmd: string) {
    super(`Command not allowed: ${cmd.trim().split(/\s+/)[0]}`);
    this.name = "ExecDeniedError";
  }
}

export function guardExec(cmd: string): void {
  if (!isCommandAllowed(cmd)) {
    throw new ExecDeniedError(cmd);
  }
}