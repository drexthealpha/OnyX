'use client';
import { useEffect, useState } from 'react';

const NERVE_URL = process.env.NEXT_PUBLIC_NERVE_URL ?? `http://localhost:${process.env.NEXT_PUBLIC_NERVE_PORT ?? '3001'}`;

interface IntelEvent { topic: string; summary: string; score: number; timestamp: number }

export default function IntelPage() {
  const [events, setEvents] = useState<IntelEvent[]>([]);
  const [topic, setTopic] = useState('AI');

  useEffect(() => {
    const es = new EventSource(`${NERVE_URL}/intel/stream?topic=${encodeURIComponent(topic)}`);
    es.onmessage = (e) => {
      try { setEvents(prev => [JSON.parse(e.data), ...prev].slice(0, 50)); } catch {}
    };
    return () => es.close();
  }, [topic]);

  return (
    <main style={{ background: '#0d0d1f', minHeight: '100vh', color: '#ddddff', padding: '2rem' }}>
      <h1 style={{ color: '#22d3ee' }}>📡 Intel Feed</h1>
      <input
        value={topic} onChange={e => setTopic(e.target.value)}
        placeholder="Topic…"
        style={{ background: '#1a1a3e', color: '#ddddff', border: '1px solid #22d3ee', borderRadius: '0.25rem', padding: '0.5rem', marginBottom: '1rem', width: '300px' }}
      />
      <div>
        {events.map((ev, i) => (
          <div key={i} style={{ borderBottom: '1px solid #1a1a3e', padding: '0.75rem 0' }}>
            <strong style={{ color: '#22d3ee' }}>{ev.topic}</strong>
            <span style={{ marginLeft: '0.5rem', color: '#4ade80', fontSize: '0.8rem' }}>score:{ev.score?.toFixed(2)}</span>
            <p style={{ margin: '0.25rem 0', color: '#a5b4fc' }}>{ev.summary}</p>
          </div>
        ))}
      </div>
    </main>
  );
}