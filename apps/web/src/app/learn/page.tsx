'use client';
import { useState } from 'react';

const NERVE_URL = process.env.NEXT_PUBLIC_NERVE_URL ?? `http://localhost:${process.env.NEXT_PUBLIC_NERVE_PORT ?? '3001'}`;

export default function LearnPage() {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const teach = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${NERVE_URL}/tutor/teach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, learnerId: 'default' }),
      });
      const d = await r.json();
      setResult(JSON.stringify(d, null, 2));
    } catch (e: unknown) {
      setResult(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: '#0d0d1f', minHeight: '100vh', color: '#ddddff', padding: '2rem' }}>
      <h1 style={{ color: '#22d3ee' }}>🎓 TutorPanel</h1>
      <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic to learn…"
        style={{ background: '#1a1a3e', color: '#ddddff', border: '1px solid #22d3ee', borderRadius: '0.25rem', padding: '0.5rem', width: '300px' }} />
      <button onClick={teach} disabled={loading}
        style={{ marginLeft: '0.5rem', background: '#22d3ee', color: '#0d0d1f', border: 'none', borderRadius: '0.25rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
        {loading ? 'Loading…' : 'Teach Me'}
      </button>
      {result && <pre style={{ marginTop: '1rem', color: '#a5b4fc', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{result}</pre>}
    </main>
  );
}