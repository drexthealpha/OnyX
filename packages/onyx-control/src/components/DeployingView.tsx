import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t } from '../theme.js';
import { startDeployment } from '../services/deployment.js';
import { loadDeployment } from '../services/config.js';

interface Props { context: AppContext; }

export function DeployingView({ context }: Props) {
  const deploymentName = context.selectedDeployment;
  const [status, setStatus] = useState<string>('Initializing...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!deploymentName) {
      context.navigateTo('home');
      return;
    }

    const deploy = async () => {
      try {
        const deployment = await loadDeployment(deploymentName);
        if (!deployment) {
          setError('Deployment not found');
          return;
        }

        setStatus('Starting deployment...');
        
        await startDeployment(deployment.config, (p) => {
          setStatus(p.message);
          setProgress(p.progress);
        });

        setCompleted(true);
        setStatus('Deployment complete!');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Deployment failed');
      }
    };

    deploy();
  }, [deploymentName]);

  useInput((input, key) => {
    if (key.escape) {
      context.navigateTo('list');
    }
  });

  const progressBar = completed
    ? '█'.repeat(20)
    : '█'.repeat(Math.round(progress / 5)) + '░'.repeat(20 - Math.round(progress / 5));

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>Deploying ONYX</Text>
      </Box>

      <Box borderStyle="double" borderColor={t.border.focus} padding={1} marginBottom={1}>
        <Text color={t.fg.secondary}>Deployment: </Text>
        <Text color={t.accent}>{deploymentName}</Text>
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
        <Box flexDirection="row" marginBottom={1}>
          <Text color={t.fg.secondary}>Status: </Text>
          <Text color={completed ? t.status.success : t.status.info}>{status}</Text>
        </Box>
        <Box flexDirection="row">
          <Text color={t.fg.secondary}>Progress: </Text>
          <Text color={t.accent}>{progressBar}</Text>
          <Text color={t.fg.muted}> {Math.round(progress)}%</Text>
        </Box>
      </Box>

      {error && (
        <Box borderStyle="single" borderColor={t.status.error} padding={1} marginBottom={1}>
          <Text color={t.status.error}>Error: {error}</Text>
        </Box>
      )}

      {completed && (
        <Box borderStyle="single" borderColor={t.status.success} padding={1} marginBottom={1}>
          <Text color={t.status.success}>Deployment successful! Press Esc to return to list.</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Esc: Return to List</Text>
      </Box>
    </Box>
  );
}