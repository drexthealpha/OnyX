import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { nerve } from '../services/nerve.js';
import { t } from '../theme.js';
import type { AppContext } from '../App.js';
import type { SystemStatus } from '../types/index.js';

interface Props { context: AppContext; }

export function DashboardView({ context }: Props) {
  const [sysStatus, setSysStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await nerve.status() as SystemStatus;
      setSysStatus(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); return; }
    if (input === 'r') { fetchStatus(); return; }
  });

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const memoryPercent = sysStatus?.memory 
    ? Math.round((sysStatus.memory.used / sysStatus.memory.total) * 100) 
    : 0;

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/status</Text>
        <Text color={t.fg.secondary}> — System Dashboard</Text>
      </Box>

      {loading && <Text color={t.status.info}>Loading system status...</Text>}
      {error && <Text color={t.status.error}>{error}</Text>}

      {!loading && !error && sysStatus && (
        <>
          <Box flexDirection="column" borderStyle="double" borderColor={t.border.focus} padding={1} marginBottom={1}>
            <Box flexDirection="row" marginBottom={1}>
              <Text color={t.fg.secondary}>Status: </Text>
              <Text color={sysStatus.status === 'ok' ? t.status.success : t.status.error}>
                {sysStatus.status.toUpperCase()}
              </Text>
            </Box>
            <Box flexDirection="row">
              <Text color={t.fg.secondary}>Uptime: </Text>
              <Text color={t.fg.primary}>{formatUptime(sysStatus.uptime)}</Text>
            </Box>
            <Box flexDirection="row">
              <Text color={t.fg.secondary}>Nerve Port: </Text>
              <Text color={t.fg.primary}>{sysStatus.nerve_port ?? 3001}</Text>
            </Box>
          </Box>

          <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
            <Text color={t.fg.primary} bold>Memory Usage</Text>
            <Box flexDirection="row" marginTop={1}>
              <Text color={t.fg.secondary}>Used:   </Text>
              <Text color={t.fg.primary}>{sysStatus.memory?.used ?? 0} MB</Text>
            </Box>
            <Box flexDirection="row">
              <Text color={t.fg.secondary}>Total:  </Text>
              <Text color={t.fg.primary}>{sysStatus.memory?.total ?? 0} MB</Text>
            </Box>
            <Box flexDirection="row">
              <Text color={t.fg.secondary}>Usage:  </Text>
              <Text color={memoryPercent > 80 ? t.status.error : memoryPercent > 50 ? t.status.warning : t.status.success}>
                {memoryPercent}%
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text color={t.accent}>{'█'.repeat(Math.round(memoryPercent / 5))}{'░'.repeat(20 - Math.round(memoryPercent / 5))}</Text>
            </Box>
          </Box>

          <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
            <Text color={t.fg.primary} bold>Active Services</Text>
            <Text color={t.fg.secondary}>  • ONYX Core (running)</Text>
            <Text color={t.fg.secondary}>  • Nerve API (port {sysStatus.nerve_port ?? 3001})</Text>
            <Text color={t.fg.secondary}>  • Deployment Manager</Text>
            <Text color={t.fg.secondary}>  • Channel Registry</Text>
          </Box>
        </>
      )}

      {!loading && !error && context.deployments.length > 0 && (
        <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
          <Text color={t.fg.primary} bold>Deployments ({context.deployments.length})</Text>
          {context.deployments.slice(0, 5).map((dep) => (
            <Text key={dep.config.name} color={t.fg.secondary}>
              {`  ${dep.config.name.padEnd(20)} [${dep.state.status}]`}
            </Text>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>R: Refresh | Esc: Back to Home</Text>
      </Box>
    </Box>
  );
}