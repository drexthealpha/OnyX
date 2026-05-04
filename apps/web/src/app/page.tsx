'use client';
import { useState } from 'react';
import styles from './page.module.css';

const StarLogo = () => (
  <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="#d4af37" strokeWidth="2" fill="none" />
    <path d="M50 15 Q50 50 85 50 Q50 50 50 85 Q50 50 15 50 Q50 50 50 15 Z" fill="url(#goldGradient)" />
    <defs>
      <linearGradient id="goldGradient" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE08B" />
        <stop offset="0.5" stopColor="#D4AF37" />
        <stop offset="1" stopColor="#997A15" />
      </linearGradient>
    </defs>
  </svg>
);

export default function HomePage() {
  const [copied, setCopied] = useState(false);
  const stats = { uptime: '99.9%', txs: '124,592', pkgs: 37 };

  const copyInstall = () => {
    navigator.clipboard.writeText('npx @onyx/cli init');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgGlow} />
      
      <main className={styles.hero}>
        <div className={styles.logoBox}>
          <StarLogo />
        </div>
        <h1 className={styles.title}>ONYX</h1>
        <p className={styles.subtitle}>
          The Sovereign AI OS on Solana. 37 packages. 9 layers. Zero operator cost.
          Fully local, privacy-preserving, and decentralized.
        </p>

        <div className={styles.ctaGroup}>
          <a href="/intel" className={styles.btnPrimary}>Launch Dashboard</a>
          <a href="https://github.com/drexthealpha/onyx" className={styles.btnSecondary} target="_blank" rel="noreferrer">Read Docs</a>
          <button onClick={copyInstall} className={styles.terminalBtn}>
            {copied ? 'Copied!' : '> npx @onyx/cli init'}
          </button>
        </div>
      </main>

      <div className={styles.ticker}>
        <div className={styles.tickerItem}>
          <span className={styles.tickerValue}>{stats.pkgs}</span>
          <span className={styles.tickerLabel}>Packages Published</span>
        </div>
        <div className={styles.tickerItem}>
          <span className={styles.tickerValue}>{stats.txs}</span>
          <span className={styles.tickerLabel}>Devnet Transactions</span>
        </div>
        <div className={styles.tickerItem}>
          <span className={styles.tickerValue}>{stats.uptime}</span>
          <span className={styles.tickerLabel}>Nosana Uptime</span>
        </div>
      </div>

      <section className={styles.features}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>🔐</div>
          <h3 className={styles.cardTitle}>MPC Signing</h3>
          <p className={styles.cardText}>Secure non-custodial signing with dWallet/Ika integration. Keys are never held in memory.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>🛡️</div>
          <h3 className={styles.cardTitle}>Privacy-First</h3>
          <p className={styles.cardText}>Stealth addresses and FHE computing via Umbra and Encrypt. Total operational privacy.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>🧠</div>
          <h3 className={styles.cardTitle}>Local Inference</h3>
          <p className={styles.cardText}>Runs fully offline using QVAC, LiteRT, or Ollama. Fallback to Nosana decentralized GPU.</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>⚡</div>
          <h3 className={styles.cardTitle}>Autonomous</h3>
          <p className={styles.cardText}>Built-in RL memory, intelligent routing, and stealth browser automation for deep research.</p>
        </div>
      </section>

      <div className={styles.badges}>
        <div className={styles.badge}>Colosseum Frontier</div>
        <div className={styles.badge}>Encrypt / Ika</div>
        <div className={styles.badge}>Umbra</div>
        <div className={styles.badge}>Nosana</div>
        <div className={styles.badge}>QVAC</div>
        <div className={styles.badge}>100xDevs</div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <a href="https://github.com/drexthealpha/onyx" target="_blank" rel="noreferrer">GitHub</a>
          <a href="#" target="_blank" rel="noreferrer">Discord</a>
          <a href="#" target="_blank" rel="noreferrer">X (Twitter)</a>
        </div>
        <p>&copy; 2026 ONYX OS. Built for the Frontier.</p>
      </footer>
    </div>
  );
}