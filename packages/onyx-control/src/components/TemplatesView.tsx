import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t } from '../theme.js';
import type { Template } from '../types/index.js';

interface Props { context: AppContext; }

const BUILT_IN_TEMPLATES: Template[] = [
  { id: '1', name: 'basic', description: 'Basic ONYX deployment', builtIn: true, createdAt: new Date().toISOString(), provider: 'hetzner', aiProvider: 'openai', model: 'gpt-4', channel: 'telegram' },
  { id: '2', name: 'gpu', description: 'GPU-enabled ONYX with Nosana', builtIn: true, createdAt: new Date().toISOString(), provider: 'nosana', aiProvider: 'openai', model: 'gpt-4', channel: 'telegram' },
  { id: '3', name: 'privacy', description: 'Privacy-focused ONYX with Umbra', builtIn: true, createdAt: new Date().toISOString(), provider: 'digitalocean', aiProvider: 'openai', model: 'gpt-4', channel: 'telegram' },
];

export function TemplatesView({ context }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); return; }
    if (key.upArrow && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
    if (key.downArrow && selectedIndex < BUILT_IN_TEMPLATES.length - 1) setSelectedIndex(selectedIndex + 1);
    if (key.return === true) {
      const template = BUILT_IN_TEMPLATES[selectedIndex];
      if (template) {
        context.setSelectedTemplate(template);
        context.navigateTo('new');
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/templates</Text>
        <Text color={t.fg.secondary}> — Deployment Templates</Text>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1}>
        <Box flexDirection="row" marginBottom={1}>
          <Text color={t.fg.secondary}>{'  '}</Text>
          <Text color={t.fg.secondary}>{'NAME'.padEnd(16)}</Text>
          <Text color={t.fg.secondary}>{'PROVIDER'.padEnd(14)}</Text>
          <Text color={t.fg.secondary}>DESCRIPTION</Text>
        </Box>
        {BUILT_IN_TEMPLATES.map((template, i) => {
          const isSelected = i === selectedIndex;
          return (
            <Box key={template.id} flexDirection="row">
              <Text color={isSelected ? t.selection.indicator : t.fg.muted}>
                {isSelected ? '> ' : '  '}
              </Text>
              <Text color={isSelected ? t.accent : t.fg.primary}>
                {template.name.padEnd(16)}
              </Text>
              <Text color={isSelected ? t.fg.primary : t.fg.secondary}>
                {template.provider.padEnd(14)}
              </Text>
              <Text color={t.fg.muted}>{template.description}</Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Up/Down: Select | Enter: Use Template | Esc: Back</Text>
      </Box>
    </Box>
  );
}
