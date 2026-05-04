import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { AppContext } from '../App.js';
import type { DeploymentConfig, Provider } from '../types/index.js';
import { t } from '../theme.js';
import { saveDeployment } from '../services/config.js';

interface Props { context: AppContext; }

type Step = 'name' | 'provider' | 'hetzner' | 'digitalocean' | 'nosana' | 'confirm';

export function NewDeployment({ context }: Props) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<Provider | ''>('');
  const [hetznerApiKey, setHetznerApiKey] = useState('');
  const [hetznerLocation, setHetznerLocation] = useState('ash');
  const [hetznerServerType, setHetznerServerType] = useState('cpx11');
  const [doApiKey, setDoApiKey] = useState('');
  const [doRegion, setDoRegion] = useState('nyc1');
  const [doSize, setDoSize] = useState('s-1vcpu-2gb');
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'name') {
        context.navigateTo('home');
      } else {
        setStep('name');
      }
      return;
    }
    if (input === 'r') { setError(null); return; }
  });

  const handleNext = () => {
    if (step === 'name') {
      if (!name.trim()) { setError('Name is required'); return; }
      setStep('provider');
    } else if (step === 'provider') {
      if (!provider) { setError('Provider is required'); return; }
      if (provider === 'hetzner') setStep('hetzner');
      else if (provider === 'digitalocean') setStep('digitalocean');
      else if (provider === 'nosana') setStep('nosana');
    } else if (step === 'hetzner') {
      if (!hetznerApiKey) { setError('API key is required'); return; }
      setStep('confirm');
    } else if (step === 'digitalocean') {
      if (!doApiKey) { setError('API key is required'); return; }
      setStep('confirm');
    } else if (step === 'nosana') {
      setStep('confirm');
    } else if (step === 'confirm') {
      createDeployment();
    }
  };

  const createDeployment = async () => {
    try {
      const config: DeploymentConfig = {
        name: name.trim(),
        provider: provider as Provider,
        createdAt: new Date().toISOString(),
        hetzner: provider === 'hetzner' ? {
          apiKey: hetznerApiKey,
          serverType: hetznerServerType,
          location: hetznerLocation,
          image: 'ubuntu-24.04',
        } : undefined,
        digitalocean: provider === 'digitalocean' ? {
          apiKey: doApiKey,
          size: doSize,
          region: doRegion,
          image: 'ubuntu-24-04-x64',
        } : undefined,
        onyxAgent: {
          aiProvider,
          aiApiKey,
          model,
          channel: 'telegram',
          telegramBotToken: '',
        },
      };

      await saveDeployment({
        config,
        state: {
          status: 'initialized',
          checkpoints: [],
          updatedAt: new Date().toISOString(),
        },
        sshKeyPath: '',
      });

      context.refreshDeployments();
      context.navigateTo('list');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create deployment');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <Box flexDirection="column">
            <Text color={t.fg.secondary}>Deployment Name:</Text>
            <TextInput value={name} onChange={setName} onSubmit={handleNext} placeholder="my-onyx" focus />
          </Box>
        );
      case 'provider':
        return (
          <Box flexDirection="column">
            <Text color={t.fg.secondary}>Select Provider:</Text>
            <Text color={t.fg.primary}>  [1] hetzner</Text>
            <Text color={t.fg.primary}>  [2] digitalocean</Text>
            <Text color={t.fg.primary}>  [3] nosana (GPU compute)</Text>
            <Box marginTop={1}><Text color={t.fg.muted}>Press 1, 2, or 3 to select</Text></Box>
          </Box>
        );
      case 'hetzner':
        return (
          <Box flexDirection="column">
            <Text color={t.fg.secondary}>Hetzner API Key:</Text>
            <TextInput value={hetznerApiKey} onChange={setHetznerApiKey} onSubmit={handleNext} placeholder="api_key..." focus />
            <Box marginTop={1}><Text color={t.fg.muted}>Location: {hetznerLocation}</Text></Box>
            <Text color={t.fg.muted}>Server Type: {hetznerServerType}</Text>
          </Box>
        );
      case 'digitalocean':
        return (
          <Box flexDirection="column">
            <Text color={t.fg.secondary}>DigitalOcean API Key:</Text>
            <TextInput value={doApiKey} onChange={setDoApiKey} onSubmit={handleNext} placeholder="api_token..." focus />
            <Box marginTop={1}><Text color={t.fg.muted}>Region: {doRegion}</Text></Box>
            <Text color={t.fg.muted}>Size: {doSize}</Text>
          </Box>
        );
      case 'nosana':
        return (
          <Box flexDirection="column">
            <Text color={t.fg.secondary}>Nosana GPU Compute</Text>
            <Box marginTop={1}><Text color={t.fg.muted}>Uses Nosana's distributed GPU network.</Text></Box>
            <Text color={t.fg.muted}>No API key required for public markets.</Text>
          </Box>
        );
      case 'confirm':
        return (
          <Box flexDirection="column">
            <Text color={t.fg.primary} bold>Confirm Deployment</Text>
            <Text color={t.fg.secondary}>Name: {name}</Text>
            <Text color={t.fg.secondary}>Provider: {provider}</Text>
            {provider === 'hetzner' && <Text color={t.fg.muted}>Location: {hetznerLocation}</Text>}
            {provider === 'digitalocean' && <Text color={t.fg.muted}>Region: {doRegion}</Text>}
            <Box marginTop={1}><Text color={t.status.info}>Press Enter to create deployment</Text></Box>
          </Box>
        );
    }
  };

  useInput((input) => {
    if (step === 'provider') {
      if (input === '1') { setProvider('hetzner'); handleNext(); }
      if (input === '2') { setProvider('digitalocean'); handleNext(); }
      if (input === '3') { setProvider('nosana'); handleNext(); }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" marginBottom={1}>
        <Text color={t.accent}>/new</Text>
        <Text color={t.fg.secondary}> — Create Deployment</Text>
      </Box>

      {error && (
        <Box borderStyle="single" borderColor={t.status.error} padding={1} marginBottom={1}>
          <Text color={t.status.error}>{error}</Text>
        </Box>
      )}

      <Box borderStyle="double" borderColor={t.border.focus} padding={1}>
        {renderStep()}
      </Box>

      <Box marginTop={1}>
        <Text color={t.fg.muted}>Enter: Next | Esc: Back</Text>
      </Box>
    </Box>
  );
}
