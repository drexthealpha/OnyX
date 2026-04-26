import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { nerve } from '../services/nerve.js';
import { t } from '../theme.js';
import type { AppContext } from '../App.js';
import type { Channel } from '../types/index.js';

interface Props { context: AppContext; }

export function ChannelsView({ context }: Props) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewState, setViewState] = useState<'list' | 'detail'>('list');

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await nerve.channels() as Channel[];
      setChannels(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChannels(); }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (viewState === 'detail') {
        setViewState('list');
      } else {
        context.navigateTo('home');
      }
      return;
    }
    if (input === 'r') { fetchChannels(); return; }
    if (viewState === 'list') {
      if (key.upArrow && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
      if (key.downArrow && selectedIndex < channels.length - 1) setSelectedIndex(selectedIndex + 1);
      if (key.return === true && channels.length > 0) {
        setViewState('detail');
      }
    }
  });

  const selectedChannel = channels[selectedIndex];

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/channels</Text>
        <Text color={t.fg.secondary}> — ONYX Channels</Text>
      </Box>

      {loading && <Text color={t.status.info}>Loading channels...</Text>}
      {error && <Text color={t.status.error}>{error}</Text>}

      {!loading && !error && viewState === 'list' && (
        <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1}>
          {channels.length === 0 ? (
            <Text color={t.fg.muted}>No channels configured.</Text>
          ) : (
            <>
              <Box flexDirection="row" marginBottom={1}>
                <Text color={t.fg.secondary}>{'  '}</Text>
                <Text color={t.fg.secondary}>{'ID'.padEnd(24)}</Text>
                <Text color={t.fg.secondary}>{'NAME'.padEnd(20)}</Text>
                <Text color={t.fg.secondary}>{'TYPE'.padEnd(12)}</Text>
                <Text color={t.fg.secondary}>AGENT ID</Text>
              </Box>
              {channels.map((channel, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <Box key={channel.id} flexDirection="row" backgroundColor={isSelected ? t.selection.bg : undefined}>
                    <Text color={isSelected ? t.selection.indicator : t.fg.muted}>
                      {isSelected ? '> ' : '  '}
                    </Text>
                    <Text color={isSelected ? t.accent : t.fg.primary}>
                      {channel.id.slice(0, 22).padEnd(24)}
                    </Text>
                    <Text color={isSelected ? t.fg.primary : t.fg.secondary}>
                      {channel.name.slice(0, 18).padEnd(20)}
                    </Text>
                    <Text color={isSelected ? t.fg.primary : t.fg.secondary}>
                      {channel.type.padEnd(12)}
                    </Text>
                    <Text color={t.fg.muted}>{channel.agentId?.slice(0, 16) ?? '-'}</Text>
                  </Box>
                );
              })}
            </>
          )}
        </Box>
      )}

      {!loading && !error && viewState === 'detail' && selectedChannel && (
        <Box flexDirection="column" borderStyle="double" borderColor={t.border.focus} padding={1}>
          <Text color={t.fg.primary} bold>Channel Details</Text>
          <Text color={t.fg.secondary}>ID:   <Text color={t.fg.primary}>{selectedChannel.id}</Text></Text>
          <Text color={t.fg.secondary}>Name: <Text color={t.fg.primary}>{selectedChannel.name}</Text></Text>
          <Text color={t.fg.secondary}>Type: <Text color={t.fg.primary}>{selectedChannel.type}</Text></Text>
          <Text color={t.fg.secondary}>Agent: <Text color={t.fg.primary}>{selectedChannel.agentId ?? 'N/A'}</Text></Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>
          {viewState === 'list' ? 'Up/Down: Select | Enter: Details | R: Refresh | Esc: Back' : 'Esc: Back to list'}
        </Text>
      </Box>
    </Box>
  );
}