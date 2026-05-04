import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { nerve } from '../services/nerve.js';
import { t } from '../theme.js';
import type { AppContext } from '../App.js';
import type { IntelBrief } from '../types/index.js';

interface Props { context: AppContext; }

type ViewState = 'input' | 'loading' | 'viewing' | 'error';

export function IntelView({ context }: Props) {
  const [viewState, setViewState] = useState<ViewState>('input');
  const [topic, setTopic] = useState('');
  const [brief, setBrief] = useState<IntelBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = async (t: string) => {
    if (!t.trim()) return;
    setViewState('loading');
    try {
      const result = await nerve.intelBrief(t) as IntelBrief;
      setBrief(result);
      setViewState('viewing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch brief');
      setViewState('error');
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      if (viewState === 'input') context.navigateTo('home');
      else setViewState('input');
      return;
    }
    if (input === 'r' && viewState === 'viewing' && brief) {
      fetchBrief(brief.topic);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/intel</Text>
        <Text color={t.fg.secondary}> — Real-Time Intelligence Briefs</Text>
      </Box>

      {(viewState === 'input' || viewState === 'loading') && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={t.fg.secondary}>Topic:</Text>
          <TextInput
            value={topic}
            onChange={setTopic}
            onSubmit={(v) => fetchBrief(v)}
            placeholder="e.g. Solana DeFi, AI agents, Nosana..."
            focus={viewState === 'input'}
          />
        </Box>
      )}

      {viewState === 'loading' && (
        <Text color={t.status.info}>Gathering intel on "{topic}"...</Text>
      )}

      {viewState === 'error' && (
        <Box borderStyle="single" borderColor={t.status.error} padding={1}>
          <Text color={t.status.error}>{error}</Text>
        </Box>
      )}

      {viewState === 'viewing' && brief && (
        <>
          <Box borderStyle="double" borderColor={t.border.focus} padding={1} marginBottom={1}>
            <Box flexDirection="column">
              <Box flexDirection="row" marginBottom={1}>
                <Text color={t.fg.secondary}>Topic: </Text>
                <Text color={t.accent}>{brief.topic}</Text>
                <Text color={t.fg.muted}>  confidence: {(brief.confidence * 100).toFixed(0)}%</Text>
              </Box>
              <Text color={t.fg.primary}>{brief.brief}</Text>
            </Box>
          </Box>

          <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1}>
            <Text color={t.fg.secondary}>Sources ({brief.sources?.length ?? 0})</Text>
            {(brief.sources ?? []).slice(0, 6).map((src, i) => (
              <Box key={i} flexDirection="row">
                <Text color={t.fg.muted}>[{src.platform.slice(0,8).padEnd(8)}] </Text>
                <Text color={t.fg.primary}>{src.title.slice(0, 60)}</Text>
              </Box>
            ))}
          </Box>
        </>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>
          {viewState === 'viewing' ? 'R: Refresh | Esc: New topic' : 'Enter: Search | Esc: Back'}
        </Text>
      </Box>
    </Box>
  );
}
