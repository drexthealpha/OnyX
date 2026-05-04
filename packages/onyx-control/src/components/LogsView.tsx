import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t } from '../theme.js';
import { nerve } from '../services/nerve.js';

interface Props { context: AppContext; }

export function LogsView({ context }: Props) {
  const deploymentName = context.selectedDeployment;
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deploymentName) {
      context.navigateTo('home');
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const logOutput = await nerve.deploymentLogs(deploymentName);
        setLogs(Array.isArray(logOutput) ? logOutput : String(logOutput).split('\n'));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [deploymentName]);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('list'); return; }
    if (input === 'r') {
      if (deploymentName) {
        setLoading(true);
        nerve.deploymentLogs(deploymentName)
          .then(logOutput => {
            setLogs(Array.isArray(logOutput) ? logOutput : String(logOutput).split('\n'));
            setLoading(false);
          })
          .catch(e => {
            setError(e instanceof Error ? e.message : 'Failed to fetch logs');
            setLoading(false);
          });
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/logs</Text>
        <Text color={t.fg.secondary}> — Deployment Logs</Text>
        {deploymentName && <Text color={t.accent}> ({deploymentName})</Text>}
      </Box>

      {loading && <Text color={t.status.info}>Loading logs...</Text>}
      {error && <Text color={t.status.error}>{error}</Text>}

      {!loading && !error && (
        <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} height={20}>
          {logs.length === 0 ? (
            <Text color={t.fg.muted}>No logs available.</Text>
          ) : (
            logs.slice(0, 100).map((line, i) => (
              <Text key={i} color={t.fg.secondary}>{line.slice(0, 120)}</Text>
            ))
          )}
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>R: Refresh | Esc: Back</Text>
      </Box>
    </Box>
  );
}
