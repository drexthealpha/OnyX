const BASE = import.meta.env.VITE_NERVE_URL ?? "";
const TOKEN = import.meta.env.VITE_NERVE_TOKEN ?? "";

function headers(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (TOKEN) (h as Record<string, string>)["Authorization"] = `Bearer ${TOKEN}`;
  return h;
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export function connectSSE(onEvent: (e: MessageEvent) => void): EventSource {
  const es = new EventSource(`${BASE}/events`);
  es.onmessage = onEvent;
  return es;
}