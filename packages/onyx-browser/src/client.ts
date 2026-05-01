import type { BrowserClient, Tab, Snapshot, Cookie } from "../types";

export function createClient(baseUrl: string): BrowserClient {
  const base = baseUrl.replace(/\/$/, "");

  async function fetchJson<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      headers: { "Content-Type": "application/json", ...opts?.headers },
      ...opts,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    return res.json();
  }

  return {
    async createTab(url?: string): Promise<Tab> {
      return fetchJson<Tab>("/tab/create", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
    },

    async listTabs(): Promise<Tab[]> {
      return fetchJson<Tab[]>("/tabs");
    },

    async getSnapshot(tabId: string): Promise<Snapshot> {
      return fetchJson<Snapshot>(`/tab/${tabId}/snapshot`);
    },

    async click(tabId: string, elementRef: string): Promise<void> {
      await fetchJson(`/tab/${tabId}/click`, {
        method: "POST",
        body: JSON.stringify({ elementRef }),
      });
    },

    async navigate(tabId: string, url: string): Promise<Snapshot> {
      return fetchJson<Snapshot>(`/tab/${tabId}/navigate`, {
        method: "POST",
        body: JSON.stringify({ url }),
      });
    },

    async type(
      tabId: string,
      elementRef: string,
      text: string,
      pressEnter?: boolean
    ): Promise<void> {
      await fetchJson(`/tab/${tabId}/type`, {
        method: "POST",
        body: JSON.stringify({ elementRef, text, pressEnter }),
      });
    },

    async scroll(
      tabId: string,
      direction: "up" | "down" | "left" | "right",
      pixels?: number
    ): Promise<void> {
      await fetchJson(`/tab/${tabId}/scroll`, {
        method: "POST",
        body: JSON.stringify({ direction, pixels }),
      });
    },

    async screenshot(tabId: string): Promise<string> {
      const res = await fetchJson<{ tabId: string; screenshot: string }>(
        `/tab/${tabId}/screenshot`
      );
      return res.screenshot;
    },

    async closeTab(tabId: string): Promise<void> {
      await fetchJson(`/tab/${tabId}`, { method: "DELETE" });
    },

    async importCookies(cookies: Cookie[]): Promise<void> {
      const tabs = await this.listTabs();
      if (tabs.length === 0) {
        throw new Error("No tabs available for cookie import");
      }
      await fetchJson(`/tab/${tabs[0].id}/cookies`, {
        method: "POST",
        body: JSON.stringify({ cookies }),
      });
    },
  };
}
