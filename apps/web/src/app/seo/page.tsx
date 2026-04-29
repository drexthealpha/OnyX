'use client';
import { useState } from 'react';

const NERVE_URL = process.env.NEXT_PUBLIC_NERVE_URL ?? `http://localhost:${process.env.NEXT_PUBLIC_NERVE_PORT ?? '3001'}`;

export default function SeoPage() {
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${NERVE_URL}/seo/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      setResult(JSON.stringify(await r.json(), null, 2));
    } catch (e: unknown) { setResult(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <main style={{ background: '#0d0d1f', minHeight: '100vh', color: '#ddddff', padding: '2rem' }}>
      <h1 style={{ color: '#22d3ee' }}>📈 SEO Dashboard</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Target keyword…"
          style={{ background: '#1a1a3e', color: '#ddddff', border: '1px solid #22d3ee', borderRadius: '0.25rem', padding: '0.5rem', flex: 1 }} />
        <button onClick={run} disabled={loading}
          style={{ background: '#22d3ee', color: '#0d0d1f', border: 'none', borderRadius: '0.25rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          {loading ? 'Running…' : 'Research'}
        </button>
      </div>
      {result && <pre style={{ color: '#a5b4fc', fontSize: '0.85rem', whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto' }}>{result}</pre>}
    </main>
  );
}