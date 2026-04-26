import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t, statusColor } from '../theme.js';

interface Props { context: AppContext; }

export function DeployView({ context }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); return; }
    if (key.upArrow && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
    if (key.downArrow && selectedIndex < context.deployments.length - 1) setSelectedIndex(selectedIndex + 1);
    if (key.return === true && context.deployments.length > 0) {
      const deployment = context.deployments[selectedIndex];
      if (deployment) {
        context.navigateTo('deploying', deployment.config.name);
      }
    }
  });

  const deployableDeployments = context.deployments.filter(d => d.state.status !== 'deployed' && d.state.status !== 'provisioning');

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/deploy</Text>
        <Text color={t.fg.secondary}> — Select Deployment to Deploy</Text>
      </Box>

      {deployableDeployments.length === 0 ? (
        <Box borderStyle="single" borderColor={t.border.default} padding={1}>
          <Text color={t.fg.muted}>No deployable deployments. Create one with /new or select from /list.</Text>
        </Box>
      ) : (
        <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1}>
          <Box flexDirection="row" marginBottom={1}>
            <Text color={t.fg.secondary}>{'  '}</Text>
            <Text color={t.fg.secondary}>{'NAME'.padEnd(24)}</Text>
            <Text color={t.fg.secondary}>{'PROVIDER'.padEnd(16)}</Text>
            <Text color={t.fg.secondary}>STATUS</Text>
          </Box>
          {deployableDeployments.map((deployment, i) => {
            const isSelected = i === selectedIndex;
            return (
              <Box key={deployment.config.name} flexDirection="row" backgroundColor={isSelected ? t.selection.bg : undefined}>
                <Text color={isSelected ? t.selection.indicator : t.fg.muted}>
                  {isSelected ? '> ' : '  '}
                </Text>
                <Text color={isSelected ? t.accent : t.fg.primary}>
                  {deployment.config.name.slice(0, 22).padEnd(24)}
                </Text>
                <Text color={isSelected ? t.fg.primary : t.fg.secondary}>
                  {deployment.config.provider.padEnd(16)}
                </Text>
                <Text color={statusColor(deployment.state.status)}>{deployment.state.status}</Text>
              </Box>
            );
          })}
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Up/Down: Select | Enter: Deploy | Esc: Back</Text>
      </Box>
    </Box>
  );
}