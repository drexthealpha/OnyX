import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { AppContext } from '../App.js';
import type { ViewName } from '../types/index.js';
import { t } from '../theme.js';

interface Props { context: AppContext; }

const LOGO = `
     ██████╗ ███╗   ██╗██╗   ██╗██╗  ██╗
    ██╔═══██╗████╗  ██║╚██╗ ██╔╝╚██╗██╔╝
    ██║   ██║██╔██╗ ██║ ╚████╔╝  ╚███╔╝
    ██║   ██║██║╚██╗██║  ╚██╔╝   ██╔██╗
    ╚██████╔╝██║ ╚████║   ██║   ██╔╝ ██╗
     ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝
`;

const COMMANDS: Array<{ name: string; description: string; view: ViewName }> = [
  { name: '/status', description: 'System status & health', view: 'dashboard' },
  { name: '/new', description: 'Create new deployment', view: 'new' },
  { name: '/list', description: 'List all deployments', view: 'list' },
  { name: '/deploy', description: 'Deploy a configuration', view: 'deploy' },
  { name: '/templates', description: 'View deployment templates', view: 'templates' },
  { name: '/channels', description: 'Manage ONYX channels', view: 'channels' },
  { name: '/nosana', description: 'Manage Nosana GPU compute jobs', view: 'nosana' },
  { name: '/trading', description: 'Portfolio & trading overview', view: 'trading' },
  { name: '/privacy', description: 'Private vault & shielding', view: 'privacy' },
  { name: '/intel', description: 'Real-time intelligence briefs', view: 'intel' },
  { name: '/tutor', description: 'Knowledge map & learning sessions', view: 'tutor' },
  { name: '/browser', description: 'Autonomous browser control', view: 'browser' },
  { name: '/logs', description: 'View deployment logs', view: 'logs' },
  { name: '/ssh', description: 'SSH into deployment', view: 'ssh' },
  { name: '/destroy', description: 'Destroy deployment', view: 'destroy' },
  { name: '/help', description: 'Show all commands', view: 'help' },
];

export function Home({ context }: Props) {
  const [inputValue, setInputValue] = useState('');

  useInput((input, key) => {
    if (key.escape) {
      process.exit(0);
    }
  });

  const handleSubmit = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    const cmd = COMMANDS.find(c => c.name === trimmed);
    if (cmd) {
      context.navigateTo(cmd.view);
    } else if (trimmed === 'exit' || trimmed === 'quit') {
      process.exit(0);
    } else {
      console.log(`Unknown command: ${trimmed}`);
    }
    setInputValue('');
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color={t.accent}>{LOGO}</Text>
      </Box>

      <Box flexDirection="column" borderStyle="double" borderColor={t.border.focus} padding={1} marginBottom={1}>
        <Text color={t.fg.primary}>Welcome to ONYX Control</Text>
        <Text color={t.fg.secondary}>Sovereign AI OS — Terminal UI</Text>
        <Text color={t.fg.muted}>Version 0.1.0</Text>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
        <Text color={t.fg.primary} bold>Quick Start</Text>
        <Text color={t.fg.secondary}>  /status   — View system status and health</Text>
        <Text color={t.fg.secondary}>  /nosana   — Manage GPU compute jobs</Text>
        <Text color={t.fg.secondary}>  /new      — Create a new deployment</Text>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
        <Text color={t.fg.primary} bold>Commands</Text>
        {COMMANDS.map((cmd) => (
          <Text key={cmd.name} color={t.fg.secondary}>
            {`${cmd.name.padEnd(12)} ${cmd.description}`}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text color={t.fg.muted}>Enter a command:</Text>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          placeholder="/help"
          focus
        />
      </Box>

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Esc: Exit | Tab: Auto-complete (coming soon)</Text>
      </Box>
    </Box>
  );
}