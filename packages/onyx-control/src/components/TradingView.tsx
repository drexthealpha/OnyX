import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { nerve } from '../services/nerve.js';
import { t } from '../theme.js';
import type { AppContext } from '../App.js';
import type { Portfolio } from '../types/index.js';

interface Props { context: AppContext; }

export function TradingView({ context }: Props) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const result = await nerve.portfolio() as Portfolio;
      setPortfolio(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch portfolio');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  useInput((input, key) => {
    if (key.escape) context.navigateTo('home');
    if (input === 'r') fetchPortfolio();
  });

  const last5Trades = portfolio?.recentTrades?.slice(0, 5) ?? [];

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/trading</Text>
        <Text color={t.fg.secondary}> — Portfolio Overview</Text>
      </Box>

      {loading && <Text color={t.status.info}>Loading portfolio...</Text>}
      {error && <Text color={t.status.error}>{error}</Text>}

      {portfolio && (
        <>
          <Box borderStyle="double" borderColor={t.border.focus} padding={1} marginBottom={1}>
            <Text color={t.fg.secondary}>Total Value: </Text>
            <Text color={t.status.success}>${portfolio.totalValue.toFixed(2)}</Text>
          </Box>

          <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
            <Text color={t.fg.primary} bold>Positions</Text>
            {(portfolio.positions ?? []).length === 0 && (
              <Text color={t.fg.muted}>No open positions.</Text>
            )}
            {(portfolio.positions ?? []).map((pos) => (
              <Box key={pos.token} flexDirection="row">
                <Text color={t.accent}>{pos.token.padEnd(10)}</Text>
                <Text color={t.fg.primary}>{String(pos.amount.toFixed(4)).padEnd(14)}</Text>
                <Text color={t.fg.primary}>${String(pos.value.toFixed(2)).padEnd(12)}</Text>
                <Text color={pos.pnl >= 0 ? t.status.success : t.status.error}>
                  {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                </Text>
              </Box>
            ))}
          </Box>

          <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1}>
            <Text color={t.fg.primary} bold>Recent Trades</Text>
            {last5Trades.map((trade) => (
              <Box key={trade.id} flexDirection="row">
                <Text color={t.fg.muted}>{new Date(trade.timestamp).toLocaleTimeString().padEnd(10)}</Text>
                <Text color={trade.side === 'buy' ? t.status.success : t.status.error}>
                  {trade.side.toUpperCase().padEnd(6)}
                </Text>
                <Text color={t.accent}>{trade.token.padEnd(10)}</Text>
                <Text color={t.fg.primary}>{String(trade.amount).padEnd(12)}</Text>
                <Text color={t.fg.secondary}>@ ${trade.price.toFixed(4)}</Text>
              </Box>
            ))}
            {last5Trades.length === 0 && <Text color={t.fg.muted}>No recent trades.</Text>}
          </Box>
        </>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>R: Refresh | Esc: Back</Text>
      </Box>
    </Box>
  );
}