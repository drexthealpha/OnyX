import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t } from '../theme.js';

interface Props { context: AppContext; }

export function HelpView({ context }: Props) {
  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); }
  });

  const commands = [
    { cmd: '/status', desc: 'System status & health' },
    { cmd: '/new', desc: 'Create new ONYX deployment' },
    { cmd: '/list', desc: 'List all deployments' },
    { cmd: '/deploy', desc: 'Deploy a configuration' },
    { cmd: '/templates', desc: 'View deployment templates' },
    { cmd: '/channels', desc: 'Manage ONYX channels' },
    { cmd: '/nosana', desc: 'Manage Nosana GPU compute jobs' },
    { cmd: '/trading', desc: 'Portfolio & trading overview' },
    { cmd: '/privacy', desc: 'Private vault & shielding (Umbra)' },
    { cmd: '/intel', desc: 'Real-time intelligence briefs' },
    { cmd: '/tutor', desc: 'Knowledge map & learning sessions' },
    { cmd: '/browser', desc: 'Autonomous browser control' },
    { cmd: '/logs', desc: 'View deployment logs' },
    { cmd: '/ssh', desc: 'SSH into deployment' },
    { cmd: '/destroy', desc: 'Destroy deployment' },
    { cmd: '/help', desc: 'Show this help' },
    { cmd: 'exit', desc: 'Exit onyx-control' },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/help</Text>
        <Text color={t.fg.secondary}> — ONYX Control Help</Text>
      </Box>

      <Box flexDirection="column" borderStyle="double" borderColor={t.border.focus} padding={1} marginBottom={1}>
        <Text color={t.fg.primary} bold>Commands</Text>
        {commands.map((c) => (
          <Text key={c.cmd} color={t.fg.secondary}>
            {`  ${c.cmd.padEnd(14)} ${c.desc}`}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
        <Text color={t.fg.primary} bold>Navigation</Text>
        <Text color={t.fg.secondary}>  Enter     Execute command / Select item</Text>
        <Text color={t.fg.secondary}>  Up/Down   Navigate list</Text>
        <Text color={t.fg.secondary}>  Escape    Go back / Exit</Text>
        <Text color={t.fg.secondary}>  R         Refresh data</Text>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
        <Text color={t.fg.primary} bold>Documentation</Text>
        <Text color={t.fg.secondary}>  https://docs.onyx.so</Text>
      </Box>

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Esc: Back to Home</Text>
      </Box>
    </Box>
  );
}
