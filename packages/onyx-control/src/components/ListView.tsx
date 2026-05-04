import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t, statusColor } from '../theme.js';

interface Props { context: AppContext; }

export function ListView({ context }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); return; }
    if (key.upArrow && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
    if (key.downArrow && selectedIndex < context.deployments.length - 1) setSelectedIndex(selectedIndex + 1);
    if (key.return === true && context.deployments.length > 0) {
      const deployment = context.deployments[selectedIndex];
      if (deployment) {
        context.navigateTo('status', deployment.config.name);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/list</Text>
        <Text color={t.fg.secondary}> — All Deployments</Text>
      </Box>

      {context.deployments.length === 0 ? (
        <Box borderStyle="single" borderColor={t.border.default} padding={1}>
          <Text color={t.fg.muted}>No deployments. Create one with /new.</Text>
        </Box>
      ) : (
        <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1}>
          <Box flexDirection="row" marginBottom={1}>
            <Text color={t.fg.secondary}>{'  '}</Text>
            <Text color={t.fg.secondary}>{'NAME'.padEnd(20)}</Text>
            <Text color={t.fg.secondary}>{'PROVIDER'.padEnd(14)}</Text>
            <Text color={t.fg.secondary}>{'STATUS'.padEnd(12)}</Text>
            <Text color={t.fg.secondary}>IP</Text>
          </Box>
          {context.deployments.map((deployment, i) => {
            const isSelected = i === selectedIndex;
            return (
              <Box key={deployment.config.name} flexDirection="row">
                <Text color={isSelected ? t.selection.indicator : t.fg.muted}>
                  {isSelected ? '> ' : '  '}
                </Text>
                <Text color={isSelected ? t.accent : t.fg.primary}>
                  {deployment.config.name.slice(0, 18).padEnd(20)}
                </Text>
                <Text color={isSelected ? t.fg.primary : t.fg.secondary}>
                  {deployment.config.provider.padEnd(14)}
                </Text>
                <Text color={statusColor(deployment.state.status)}>
                  {deployment.state.status.padEnd(12)}
                </Text>
                <Text color={t.fg.muted}>{deployment.state.serverIp ?? '-'}</Text>
              </Box>
            );
          })}
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Up/Down: Select | Enter: View Details | Esc: Back</Text>
      </Box>
    </Box>
  );
}
