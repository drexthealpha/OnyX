import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AppContext } from '../App.js';
import { t, statusColor } from '../theme.js';
import { nerve } from '../services/nerve.js';

interface Props { context: AppContext; }

export function StatusView({ context }: Props) {
  const deploymentName = context.selectedDeployment;
  const deployment = context.deployments.find(d => d.config.name === deploymentName);
  const [nerveStatus, setNerveStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkNerve = async () => {
      setLoading(true);
      try {
        const status = await nerve.status();
        setNerveStatus(status);
      } catch {
        setNerveStatus(null);
      } finally {
        setLoading(false);
      }
    };
    checkNerve();
  }, []);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('list'); return; }
    if (input === 'r') {
      setLoading(true);
      nerve.status()
        .then(setNerveStatus)
        .catch(() => setNerveStatus(null))
        .finally(() => setLoading(false));
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/status</Text>
        <Text color={t.fg.secondary}> — Deployment Status</Text>
        {deploymentName && <Text color={t.accent}> ({deploymentName})</Text>}
      </Box>

      {deployment && (
        <Box flexDirection="column" borderStyle="double" borderColor={t.border.focus} padding={1} marginBottom={1}>
          <Text color={t.fg.primary} bold>Deployment: {deployment.config.name}</Text>
          <Text color={t.fg.secondary}>Provider: {deployment.config.provider}</Text>
          <Text color={t.fg.secondary}>Status: <Text color={statusColor(deployment.state.status)}>{deployment.state.status}</Text></Text>
          <Text color={t.fg.secondary}>Server IP: {deployment.state.serverIp ?? 'N/A'}</Text>
          {deployment.state.tailscaleIp && (
            <Text color={t.fg.secondary}>Tailscale: {deployment.state.tailscaleIp}</Text>
          )}
          {deployment.state.deployedAt && (
            <Text color={t.fg.muted}>Deployed: {new Date(deployment.state.deployedAt).toLocaleString()}</Text>
          )}
        </Box>
      )}

      <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
        <Text color={t.fg.primary} bold>Checkpoints</Text>
        {deployment?.state.checkpoints.length === 0 && (
          <Text color={t.fg.muted}>No checkpoints completed.</Text>
        )}
        {deployment?.state.checkpoints.map((cp, i) => (
          <Text key={i} color={t.status.success}>
            {`  ✓ ${cp.name} (${new Date(cp.completedAt).toLocaleTimeString()})`}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
        <Text color={t.fg.primary} bold>ONYX Daemon Health</Text>
        {loading ? (
          <Text color={t.status.info}>Checking...</Text>
        ) : nerveStatus ? (
          <Text color={t.status.success}>✓ ONYX daemon is running</Text>
        ) : (
          <Text color={t.status.error}>✗ ONYX daemon is not responding</Text>
        )}
      </Box>

      {deployment?.state.lastError && (
        <Box borderStyle="single" borderColor={t.status.error} padding={1} marginBottom={1}>
          <Text color={t.status.error}>Last Error: {deployment.state.lastError}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>R: Refresh | Esc: Back</Text>
      </Box>
    </Box>
  );
}
