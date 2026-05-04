import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t } from '../theme.js';
import { openTerminalWithCommand } from '../utils/terminal.js';

interface Props { context: AppContext; }

export function SSHView({ context }: Props) {
  const deployment = context.deployments.find(d => d.config.name === context.selectedDeployment);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('list'); return; }
    if (key.return === true && deployment) {
      if (deployment.state.serverIp) {
        const sshCmd = `ssh -i "${deployment.sshKeyPath}" root@${deployment.state.serverIp}`;
        openTerminalWithCommand(sshCmd);
        context.navigateTo('list');
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/ssh</Text>
        <Text color={t.fg.secondary}> — SSH into Deployment</Text>
      </Box>

      {deployment ? (
        <Box flexDirection="column" borderStyle="double" borderColor={t.border.focus} padding={1} marginBottom={1}>
          <Text color={t.fg.secondary}>Deployment: </Text>
          <Text color={t.accent}>{deployment.config.name}</Text>
          <Box marginTop={1}><Text color={t.fg.secondary}>IP: </Text></Box>
          <Text color={t.fg.primary}>{deployment.state.serverIp ?? 'Not available'}</Text>
          <Box marginTop={1}><Text color={t.fg.secondary}>SSH Key: </Text></Box>
          <Text color={t.fg.muted}>{deployment.sshKeyPath}</Text>
          <Box marginTop={2}><Text color={t.status.info}>Press Enter to open SSH terminal</Text></Box>
        </Box>
      ) : (
        <Box borderStyle="single" borderColor={t.border.default} padding={1}>
          <Text color={t.fg.muted}>Select a deployment from /list first.</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Enter: SSH | Esc: Back</Text>
      </Box>
    </Box>
  );
}
