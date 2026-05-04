import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { nerve } from '../services/nerve.js';
import { t } from '../theme.js';
import type { AppContext } from '../App.js';
import type { TutorProfile, TutorDomain } from '../types/index.js';

interface Props { context: AppContext; }

function levelBar(level: number): string {
  const filled = Math.round((level / 100) * 20);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

export function TutorView({ context }: Props) {
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const result = await nerve.tutorProfile('default') as TutorProfile;
      setProfile(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tutor profile');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const domains = profile?.domains ?? [];

  useInput((input, key) => {
    if (key.escape) { context.navigateTo('home'); return; }
    if (key.upArrow && selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
    if (key.downArrow && selectedIndex < domains.length - 1) setSelectedIndex(selectedIndex + 1);
    if (input === 's' && domains.length > 0) {
      const domain = domains[selectedIndex];
      setSessionMsg(`Starting session on "${domain?.name}" — POST /tutor/session { domain: '${domain?.name}', profileId: 'default' }`);
    }
    if (input === 'r') { fetchProfile(); setSessionMsg(null); }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/tutor</Text>
        <Text color={t.fg.secondary}> — Knowledge Map</Text>
      </Box>

      {loading && <Text color={t.status.info}>Loading knowledge map...</Text>}
      {error && <Text color={t.status.error}>{error}</Text>}

      {profile && domains.length > 0 && (
        <Box flexDirection="column" borderStyle="single" borderColor={t.border.default} padding={1} marginBottom={1}>
          {domains.map((domain, i) => {
            const isSelected = i === selectedIndex;
            return (
              <Box key={domain.name} flexDirection="row" marginBottom={0}>
                <Text color={isSelected ? t.selection.indicator : t.fg.muted}>
                  {isSelected ? '> ' : '  '}
                </Text>
                <Text color={isSelected ? t.accent : t.fg.primary}>
                  {domain.name.padEnd(20).slice(0, 20)}
                </Text>
                <Text color={t.status.success}>{levelBar(domain.level)} </Text>
                <Text color={t.fg.secondary}>{domain.level}%</Text>
                <Text color={t.fg.muted}> ({domain.sessions} sessions)</Text>
              </Box>
            );
          })}
        </Box>
      )}

      {profile && domains.length === 0 && (
        <Text color={t.fg.muted}>No domain knowledge recorded yet. Start using ONYX to build your profile.</Text>
      )}

      {sessionMsg && (
        <Box borderStyle="single" borderColor={t.status.info} padding={1} marginBottom={1}>
          <Text color={t.status.info}>{sessionMsg}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Up/Down: Select domain | S: Start session | R: Refresh | Esc: Back</Text>
      </Box>
    </Box>
  );
}
