'use client';
import { useState } from 'react';

const NERVE_URL = process.env.NEXT_PUBLIC_NERVE_URL ?? `http://localhost:${process.env.NEXT_PUBLIC_NERVE_PORT ?? '3001'}`;

export default function SpatialPage() {
  const [scene, setScene] = useState<object | null>(null);
  const [desc, setDesc] = useState('');

  const loadScene = async () => {
    const r = await fetch(`${NERVE_URL}/scene`);
    setScene(await r.json());
  };

  const addNode = async () => {
    await fetch(`${NERVE_URL}/scene/node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc }),
    });
    loadScene();
  };

  return (
    <main style={{ background: '#0d0d1f', minHeight: '100vh', color: '#ddddff', padding: '2rem' }}>
      <h1 style={{ color: '#22d3ee' }}>🌐 3D Spatial Editor</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Node description…"
          style={{ background: '#1a1a3e', color: '#ddddff', border: '1px solid #22d3ee', borderRadius: '0.25rem', padding: '0.5rem', flex: 1 }} />
        <button onClick={addNode}
          style={{ background: '#22d3ee', color: '#0d0d1f', border: 'none', borderRadius: '0.25rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Add Node
        </button>
        <button onClick={loadScene}
          style={{ background: 'transparent', color: '#22d3ee', border: '1px solid #22d3ee', borderRadius: '0.25rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>
      {scene && <pre style={{ color: '#a5b4fc', fontSize: '0.85rem', whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto' }}>{JSON.stringify(scene, null, 2)}</pre>}
    </main>
  );
}