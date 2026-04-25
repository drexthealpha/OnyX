export interface HttpCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
}

export interface HttpCallResult {
  status: number;
  ok: boolean;
  body: unknown;
}

export async function httpCall(url: string, options: HttpCallOptions = {}): Promise<HttpCallResult> {
  const { method = 'GET', headers = {}, body } = options;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  return { status: res.status, ok: res.ok, body: parsed };
}