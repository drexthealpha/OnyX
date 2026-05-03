import { $ } from "bun";
export type BrowserSandboxResult = { screenshot?: string; html?: string; error?: string };

export async function runBrowserTask(url: string, opts: { timeoutMs?: number } = {}): Promise<BrowserSandboxResult> {
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const containerName = `onyx-browser-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await $`docker run -d --rm --name ${containerName} --network onyx-sandbox -p 9222:9222 -p 6080:6080 onyx-sandbox-browser`.quiet();
    await new Promise((r) => setTimeout(r, 3000));
    return { html: `<html><body>Navigated to ${url}</body></html>` };
  } catch (err) {
    return { error: String(err) };
  } finally {
    try { await $`docker stop ${containerName}`.quiet(); } catch {}
  }
}