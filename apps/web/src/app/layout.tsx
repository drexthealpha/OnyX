import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ONYX — Sovereign AI OS',
  description: 'ONYX: Sovereign AI OS on Solana. 37 packages, 9 layers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0d0d1f' }}>{children}</body>
    </html>
  );
}