'use client';
import { useState } from 'react';

const NERVE_URL = process.env.NEXT_PUBLIC_NERVE_URL ?? `http://localhost:${process.env.NEXT_PUBLIC_NERVE_PORT ?? '3001'}`;

export default function BrowserPage() {
  const [url, setUrl] = useState('https://example.com');
  const [html, setHtml] = useState<string | null>(null);

  const navigate = async () => {
    const r = await fetch(`${NERVE_URL}/browser-tab/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const d = await r.json();
    setHtml(d.html ?? JSON.stringify(d));
  };

  return (
    <main style={{ background: '#0d0d1f', minHeight: '100vh', color: '#ddddff', padding: '2rem' }}>
      <h1 style={{ color: '#22d3ee' }}>🌐 BrowserTab</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input value={url} onChange={e => setUrl(e.target.value)}
          style={{ background: '#1a1a3e', color: '#ddddff', border: '1px solid #22d3ee', borderRadius: '0.25rem', padding: '0.5rem', flex: 1 }} />
        <button onClick={navigate}
          style={{ background: '#22d3ee', color: '#0d0d1f', border: 'none', borderRadius: '0.25rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Navigate
        </button>
      </div>
      {html && (
        <div style={{ border: '1px solid #1a1a3e', borderRadius: '0.5rem', padding: '1rem', maxHeight: '60vh', overflow: 'auto' }}>
          <pre style={{ color: '#a5b4fc', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{html.slice(0, 10000)}</pre>
        </div>
      )}
    </main>
  );
}