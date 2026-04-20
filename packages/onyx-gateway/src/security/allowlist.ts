export const ALLOWED_COMMANDS: ReadonlySet<string> = new Set([
  "echo",
  "ls",
  "cat",
  "grep",
  "find",
  "python3",
  "node",
  "bun",
  "git",
  "curl",
  "jq",
  "rg",
  "bash",
]);

export function isCommandAllowed(cmd: string): boolean {
  const base = cmd.trim().split(/\s+/)[0] ?? "";
  return ALLOWED_COMMANDS.has(base);
}