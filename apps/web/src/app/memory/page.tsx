'use client';
import { useEffect, useState } from 'react';

const NERVE_URL = process.env.NEXT_PUBLIC_NERVE_URL ?? `http://localhost:${process.env.NEXT_PUBLIC_NERVE_PORT ?? '3001'}`;

interface Crystal { id: string; content: string; timestamp: number; tags: string[] }

export default function MemoryPage() {
  const [crystals, setCrystals] = useState<Crystal[]>([]);

  useEffect(() => {
    fetch(`${NERVE_URL}/mem/crystals?limit=20`)
      .then(r => r.json())
      .then(d => setCrystals(d.crystals ?? []))
      .catch(() => {});
  }, []);

  return (
    <main style={{ background: '#0d0d1f', minHeight: '100vh', color: '#ddddff', padding: '2rem' }}>
      <h1 style={{ color: '#22d3ee' }}>🧠 MemoryTimeline</h1>
      <div>
        {crystals.map((c) => (
          <div key={c.id} style={{ borderLeft: '3px solid #22d3ee', paddingLeft: '1rem', marginBottom: '1rem' }}>
            <div style={{ color: '#a5b4fc', fontSize: '0.75rem' }}>{new Date(c.timestamp).toLocaleString()}</div>
            <div style={{ color: '#ddddff' }}>{c.content}</div>
            <div>{c.tags?.map(t => <span key={t} style={{ marginRight: '0.5rem', color: '#4ade80', fontSize: '0.75rem' }}>#{t}</span>)}</div>
          </div>
        ))}
        {crystals.length === 0 && <p style={{ color: '#a5b4fc' }}>No memories yet. Start chatting to build memory.</p>}
      </div>
    </main>
  );
}