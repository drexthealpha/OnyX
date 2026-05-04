import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t, statusColor } from '../theme.js';
import { destroyDeployment } from '../services/deployment.js';

interface Props { context: AppContext; }

export function DestroyView({ context }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); return; }
    if (deleting) {
      if (input === '\r' || input === '\n') {
        if (confirmName === context.deployments[selectedIndex]?.config.name) {
          confirmDestroy(context.deployments[selectedIndex].config.name);
        } else {
          setError('Name mismatch. Aborted.');
          setDeleting(null);
          setConfirmName('');
        }
      } else if (input === 'Escape' || key.escape) {
        setDeleting(null);
        setConfirmName('');
        setError(null);
      } else if (key.backspace || key.delete) {
        setConfirmName(confirmName.slice(0, -1));
      } else if (input.length === 1) {
        setConfirmName(confirmName + input);
      }
      return;
    }
    if (key.upArrow && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
    if (key.downArrow && selectedIndex < context.deployments.length - 1) setSelectedIndex(selectedIndex + 1);
    if (key.return === true && context.deployments.length > 0) {
      setDeleting(context.deployments[selectedIndex]!.config.name);
      setConfirmName('');
      setError(null);
    }
  });

  const confirmDestroy = async (name: string) => {
    try {
      await destroyDeployment(name);
      context.refreshDeployments();
      setDeleting(null);
      setConfirmName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Destroy failed');
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/destroy</Text>
        <Text color={t.fg.secondary}> — Destroy Deployment</Text>
      </Box>

      {context.deployments.length === 0 ? (
        <Box borderStyle="single" borderColor={t.border.default} padding={1}>
          <Text color={t.fg.muted}>No deployments to destroy.</Text>
        </Box>
      ) : deleting ? (
        <Box flexDirection="column" borderStyle="double" borderColor={t.status.error} padding={1}>
          <Text color={t.status.warning} bold>WARNING: This will permanently delete the deployment!</Text>
          <Box marginTop={1}><Text color={t.fg.secondary}>Type the deployment name to confirm:</Text></Box>
          <Box marginTop={1}><Text color={t.accent} bold>{confirmName}</Text></Box>
          <Box marginTop={1}><Text color={t.fg.muted}>Press Enter to confirm or Esc to cancel</Text></Box>
          {error && <Box marginTop={1}><Text color={t.status.error}>{error}</Text></Box>}
        </Box>
      ) : (
        <>
          <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
            <Box flexDirection="row" marginBottom={1}>
              <Text color={t.fg.secondary}>{'  '}</Text>
              <Text color={t.fg.secondary}>{'NAME'.padEnd(24)}</Text>
              <Text color={t.fg.secondary}>{'PROVIDER'.padEnd(16)}</Text>
              <Text color={t.fg.secondary}>STATUS</Text>
            </Box>
            {context.deployments.map((deployment, i) => {
              const isSelected = i === selectedIndex;
              return (
                <Box key={deployment.config.name} flexDirection="row">
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
          <Text color={t.status.warning}>Select a deployment and press Enter to destroy it.</Text>
        </>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Up/Down: Select | Enter: Destroy | Esc: Back</Text>
      </Box>
    </Box>
  );
}
