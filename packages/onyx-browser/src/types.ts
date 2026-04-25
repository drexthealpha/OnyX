export interface Tab {
  id: string;
  url: string;
  title: string;
}

export interface Element {
  elementRef: string;
  type: string;
  text: string;
  bounds: { x: number; y: number; w: number; h: number };
}

export interface Snapshot {
  tabId: string;
  elements: Element[];
  text: string;
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface BrowserClient {
  createTab(url?: string): Promise<Tab>;
  listTabs(): Promise<Tab[]>;
  getSnapshot(tabId: string): Promise<Snapshot>;
  click(tabId: string, elementRef: string): Promise<void>;
  navigate(tabId: string, url: string): Promise<Snapshot>;
  type(tabId: string, elementRef: string, text: string, pressEnter?: boolean): Promise<void>;
  scroll(tabId: string, direction: "up" | "down" | "left" | "right", pixels?: number): Promise<void>;
  screenshot(tabId: string): Promise<string>;
  closeTab(tabId: string): Promise<void>;
  importCookies(cookies: Cookie[]): Promise<void>;
}