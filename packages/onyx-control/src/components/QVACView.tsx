import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { Spinner } from './Spinner.js';
import { ProgressBar } from './ProgressBar.js';
import { AnimatedBorder } from './AnimatedBorder.js';
import type { AppContext } from '../App.js';
import { t } from '../theme.js';

interface Props { context: AppContext; }

export function QVACView({ context }: Props) {
  const [models, setModels] = useState<string[]>(['llama-3.2-1b.bin']);
  const [selectedModel, setSelectedModel] = useState('llama-3.2-1b.bin');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [streamData, setStreamData] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // Simulate loading model for TUI
    if (!isLoaded) {
      let prog = 0;
      const timer = setInterval(() => {
        prog += 10;
        setLoadingProgress(prog);
        if (prog >= 100) {
          setIsLoaded(true);
          clearInterval(timer);
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [isLoaded]);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || !isLoaded || isStreaming) return;
    setPrompt('');
    setStreamData('');
    setIsStreaming(true);
    
    // Simulate stream
    const words = `This is a simulated local response from ${selectedModel} via QVAC...`.split(' ');
    let i = 0;
    const timer = setInterval(() => {
      if (i < words.length) {
        setStreamData((prev) => prev + (prev ? ' ' : '') + words[i]);
        i++;
      } else {
        setIsStreaming(false);
        clearInterval(timer);
      }
    }, 100);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color={t.accent} bold>QVAC Local Inference View</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text color={t.fg.primary}>Model: {selectedModel}</Text>
        {!isLoaded ? (
          <Box flexDirection="row" gap={1}>
            <Spinner color="yellow" />
            <Text color="yellow">Loading local model...</Text>
            <ProgressBar value={loadingProgress} />
          </Box>
        ) : (
          <Text color="green">Status: Loaded & Ready (P2P OK)</Text>
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
