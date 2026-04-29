'use client';
import { useEffect, useState } from 'react';

const NERVE_URL = process.env.NEXT_PUBLIC_NERVE_URL ?? `http://localhost:${process.env.NEXT_PUBLIC_NERVE_PORT ?? '3001'}`;

export default function HomePage() {
  const [nerveStatus, setNerveStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    fetch(`${NERVE_URL}/health`)
      .then(r => r.ok ? setNerveStatus('online') : setNerveStatus('offline'))
      .catch(() => setNerveStatus('offline'));
  }, []);

  return (
    <main style={{ background: '#0d0d1f', minHeight: '100vh', color: '#ddddff', fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1 style={{ color: '#22d3ee', fontSize: '3rem', margin: 0 }}>ONYX</h1>
      <p style={{ color: '#a5b4fc', fontSize: '1.2rem' }}>Sovereign AI OS on Solana</p>
      <p>Nerve: <span style={{ color: nerveStatus === 'online' ? '#4ade80' : nerveStatus === 'offline' ? '#f87171' : '#facc15' }}>{nerveStatus}</span></p>
      <nav style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { href: '/intel', label: '📡 Intel Feed' },
          { href: '/learn', label: '🎓 Learn' },
          { href: '/browser', label: '🌐 Browser' },
          { href: '/memory', label: '🧠 Memory' },
          { href: '/seo', label: '📈 SEO' },
          { href: '/spatial', label: '🌐 Spatial' },
        ].map(({ href, label }) => (
          <a key={href} href={href} style={{ color: '#22d3ee', padding: '0.5rem 1rem', border: '1px solid #22d3ee', borderRadius: '0.5rem', textDecoration: 'none' }}>
            {label}
          </a>
        ))}
      </nav>
    </main>
  );
}