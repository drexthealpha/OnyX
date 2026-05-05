import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { Spinner } from './Spinner.js';
import { ProgressBar } from './ProgressBar.js';
import { AnimatedBorder } from './AnimatedBorder.js';
import type { AppContext } from '../App.js';
import { t } from '../theme.js';
import * as qvac from '@onyx/qvac';

interface Props { context: AppContext; }

export function QVACView({ context }: Props) {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [streamData, setStreamData] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initQVAC() {
      const available = await qvac.isAvailable();
      if (!available) {
        setError('QVAC not available — no model path configured');
        return;
      }

      const modelPath = await qvac.getOfflineModel();
      setSelectedModel(modelPath);
      setModels([modelPath]);

      try {
        const modelId = await qvac.loadModel(modelPath);
        setLoadingProgress(100);
        setIsLoaded(true);
        setModels([modelId]);
      } catch (err) {
        setError(`Failed to load model: ${err}`);
      }
    }

    initQVAC();
  }, []);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || !isLoaded || isStreaming) return;
    setPrompt('');
    setStreamData('');
    setIsStreaming(true);
    setError(null);

    const modelId = models[0];
    if (!modelId) {
      setIsStreaming(false);
      setError('No model loaded');
      return;
    }

    try {
      for await (const token of qvac.stream(modelId, value)) {
        setStreamData((prev) => prev + (prev ? ' ' : '') + token);
      }
    } catch (err) {
      setError(`Stream error: ${err}`);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color={t.accent} bold>QVAC Local Inference View</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      <Box flexDirection="column" marginBottom={1}>
        <Text color={t.fg.primary}>Model: {selectedModel}</Text>
        {!isLoaded ? (
          <Box flexDirection="row" gap={1}>
            <Spinner color="yellow" />
            <Text color="yellow">Loading local model...</Text>
            <ProgressBar value={loadingProgress} />
          </Box>
        ) : (
          <Text color="green">Status: Loaded & Ready</Text>
        )}
      </Box>

      <AnimatedBorder isFocused={true}>
        <Box flexDirection="column" padding={1} width="100%">
          <Text color={t.fg.muted}>Stream Output:</Text>
          <Box minHeight={5} marginTop={1}>
            <Text>{streamData || (isStreaming ? <Spinner /> : 'Waiting for prompt...')}</Text>
          </Box>
        </Box>
      </AnimatedBorder>

      <Box marginTop={1} flexDirection="row" gap={1}>
        <Text color={t.fg.primary}>Prompt:</Text>
        <TextInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handleSubmit}
          placeholder="Type here..."
        />
      </Box>
    </Box>
  );
}
