import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { nerve } from '../services/nerve.js';
import { t } from '../theme.js';
import type { AppContext } from '../App.js';
import type { BrowserSnapshot } from '../types/index.js';

interface Props { context: AppContext; }
type ViewState = 'input' | 'loading' | 'viewing' | 'error';

export function BrowserView({ context }: Props) {
  const [viewState, setViewState] = useState<ViewState>('input');
  const [url, setUrl] = useState('');
  const [snapshot, setSnapshot] = useState<BrowserSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEl, setSelectedEl] = useState(0);

  const navigate = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setViewState('loading');
    try {
      const result = await nerve.navigate(targetUrl) as BrowserSnapshot;
      setSnapshot(result);
      setSelectedEl(0);
      setViewState('viewing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Navigation failed');
      setViewState('error');
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      if (viewState === 'input') context.navigateTo('home');
      else { setViewState('input'); setUrl(''); }
      return;
    }
    if (viewState === 'viewing' && snapshot) {
      const elements = snapshot.elements ?? [];
      if (key.upArrow) setSelectedEl(Math.max(0, selectedEl - 1));
      if (key.downArrow) setSelectedEl(Math.min(elements.length - 1, selectedEl + 1));
    }
  });

  const elements = snapshot?.elements ?? [];

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/browser</Text>
        <Text color={t.fg.secondary}> — Autonomous Browser</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color={t.fg.secondary}>URL:</Text>
        <TextInput
          value={url}
          onChange={setUrl}
          onSubmit={(v) => navigate(v)}
          placeholder="https://example.com"
          focus={viewState === 'input'}
        />
      </Box>

      {viewState === 'loading' && <Text color={t.status.info}>Navigating to {url}...</Text>}
      {viewState === 'error' && (
        <Box borderStyle="single" borderColor={t.status.error} padding={1}>
          <Text color={t.status.error}>{error}</Text>
        </Box>
      )}

      {viewState === 'viewing' && snapshot && (
        <>
          <Box borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
            <Text color={t.fg.secondary}>Snapshot text (tab: {snapshot.tabId?.slice(0,8)}...):</Text>
            <Text color={t.fg.primary}>{snapshot.text?.slice(0, 400) ?? '(empty)'}</Text>
          </Box>

          {elements.length > 0 && (
            <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1}>
              <Text color={t.fg.secondary}>Elements ({elements.length}):</Text>
              {elements.slice(0, 10).map((el, i) => {
                const isSelected = i === selectedEl;
                return (
                  <Box key={el.elementRef} flexDirection="row">
                    <Text color={isSelected ? t.selection.indicator : t.fg.muted}>
                      {isSelected ? '> ' : '  '}
                    </Text>
                    <Text color={t.fg.muted}>{`[${el.elementRef}]`.padEnd(8)}</Text>
                    <Text color={isSelected ? t.accent : t.fg.secondary}>{el.type.padEnd(10)}</Text>
                    <Text color={isSelected ? t.fg.primary : t.fg.muted}>{el.text.slice(0, 50)}</Text>
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Enter URL + Enter to navigate | Up/Down: Select element | Esc: Back</Text>
      </Box>
    </Box>
  );
}
