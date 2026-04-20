export type BrowserSandboxResult = {
  screenshot?: string;
  html?: string;
  error?: string;
};

export async function runBrowserTask(
  url: string,
  opts: { timeoutMs?: number } = {},
): Promise<BrowserSandboxResult> {
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const containerName = `onyx-browser-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await $`docker run -d --rm --name ${containerName} --network onyx-sandbox -p 9222:9222 -p 6080:6080 onyx-sandbox-browser`.quiet();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const response = await fetch(`http://localhost:9222/json/new?${url}`);
    if (!response.ok) {
      return { error: "Failed to create CDP session" };
    }

    return { html: `<html><body>Navigated to ${url}</body></html>` };
  } catch (err) {
    return { error: String(err) };
  } finally {
    try {
      await $`docker stop ${containerName}`.quiet();
    } catch {
      // Ignore cleanup errors
    }
  }
}