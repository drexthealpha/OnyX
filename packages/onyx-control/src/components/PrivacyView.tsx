import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { nerve } from '../services/nerve.js';
import { t } from '../theme.js';
import type { AppContext } from '../App.js';
import type { PrivateBalance } from '../types/index.js';

interface Props { context: AppContext; }

export function PrivacyView({ context }: Props) {
  const [balance, setBalance] = useState<PrivateBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const result = await nerve.privateBalance() as PrivateBalance;
      setBalance(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch private balance');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBalance(); }, []);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); return; }
    if (input === 'r') { fetchBalance(); return; }
    if (input === 's') { setNotice('Shield: use nerve API POST /vault/shield { mint, amount }'); }
    if (input === 'u') { setNotice('Unshield: use nerve API POST /vault/unshield { amount }'); }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/privacy</Text>
        <Text color={t.fg.secondary}> — Private Vault (Umbra Protocol)</Text>
      </Box>

      {loading && <Text color={t.status.info}>Loading private balance...</Text>}
      {error && <Text color={t.status.error}>{error}</Text>}

      {balance && (
        <>
          <Box borderStyle="double" borderColor={balance.shielded ? t.status.success : t.border.default} padding={1} marginBottom={1}>
            <Box flexDirection="column">
              <Box flexDirection="row">
                <Text color={t.fg.secondary}>{'Status:         '}</Text>
                <Text color={balance.shielded ? t.status.success : t.fg.muted}>
                  {balance.shielded ? 'SHIELDED' : 'UNSHIELDED'}
                </Text>
              </Box>
              <Box flexDirection="row">
                <Text color={t.fg.secondary}>{'Private Balance:'}</Text>
                <Text color={t.accent}> {balance.balance.toFixed(6)}</Text>
              </Box>
              <Box flexDirection="row">
                <Text color={t.fg.secondary}>{'Mint:           '}</Text>
                <Text color={t.fg.primary}> {balance.mint.slice(0, 16)}...</Text>
              </Box>
            </Box>
          </Box>

          <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
            <Text color={t.fg.secondary}>Umbra Privacy Protocol — zero-knowledge shielding on Solana.</Text>
            <Text color={t.fg.muted}>All private transfers are hidden from on-chain observers.</Text>
          </Box>
        </>
      )}

      {notice && (
        <Box borderStyle="single" borderColor={t.status.info} padding={1} marginBottom={1}>
          <Text color={t.status.info}>{notice}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>S: Shield assets | U: Unshield | R: Refresh | Esc: Back</Text>
      </Box>
    </Box>
  );
}
