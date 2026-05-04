import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { nerve } from '../services/nerve.js';
import { t } from '../theme.js';
import type { AppContext } from '../App.js';
import type { NosanaJob } from '../types/index.js';

interface Props { context: AppContext; }

export function NosanaView({ context }: Props) {
  const [jobs, setJobs] = useState<NosanaJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await nerve.computeJobs() as NosanaJob[];
      setJobs(Array.isArray(result) ? result : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); return; }
    if (input === 'r') { fetchJobs(); return; }
    if (key.upArrow && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
    if (key.downArrow && selectedIndex < jobs.length - 1) setSelectedIndex(selectedIndex + 1);
    if (input === 'c' && jobs.length > 0) {
      const job = jobs[selectedIndex];
      if (job) {
        setCancelling(job.jobId);
        setTimeout(() => { setCancelling(null); fetchJobs(); }, 1000);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/nosana</Text>
        <Text color={t.fg.secondary}> — Nosana GPU Compute Jobs</Text>
      </Box>

      {loading && <Text color={t.status.info}>Loading jobs...</Text>}
      {error && <Text color={t.status.error}>{error}</Text>}

      {!loading && !error && (
        <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1}>
          {jobs.length === 0 ? (
            <Text color={t.fg.muted}>No active compute jobs.</Text>
          ) : (
            <>
              <Box flexDirection="row" marginBottom={1}>
                <Text color={t.fg.secondary}>{'  '}</Text>
                <Text color={t.fg.secondary}>{'JOB ID'.padEnd(16)}</Text>
                <Text color={t.fg.secondary}>{'IMAGE'.padEnd(24)}</Text>
                <Text color={t.fg.secondary}>{'STATUS'.padEnd(12)}</Text>
                <Text color={t.fg.secondary}>{'COST (NOS)'.padEnd(12)}</Text>
                <Text color={t.fg.secondary}>DURATION</Text>
              </Box>
              {jobs.map((job, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <Box key={job.jobId} flexDirection="row">
                    <Text color={isSelected ? t.selection.indicator : t.fg.muted}>
                      {isSelected ? '> ' : '  '}
                    </Text>
                    <Text color={isSelected ? t.accent : t.fg.primary}>
                      {job.jobId.slice(0, 14).padEnd(16)}
                    </Text>
                    <Text color={isSelected ? t.fg.primary : t.fg.secondary}>
                      {job.image.slice(0, 22).padEnd(24)}
                    </Text>
                    <Text color={job.status === 'running' ? t.status.success : t.status.warning}>
                      {job.status.padEnd(12)}
                    </Text>
                    <Text color={t.fg.primary}>{String(job.cost.toFixed(4)).padEnd(12)}</Text>
                    <Text color={t.fg.secondary}>{job.duration}s</Text>
                  </Box>
                );
              })}
            </>
          )}
        </Box>
      )}

      {cancelling && <Text color={t.status.warning}>Cancelling job {cancelling.slice(0,8)}...</Text>}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Up/Down: Select | C: Cancel job | R: Refresh | Esc: Back</Text>
      </Box>
    </Box>
  );
}
