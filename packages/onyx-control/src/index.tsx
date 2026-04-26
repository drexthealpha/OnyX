#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  console.log('onyx-control v0.1.0');
  process.exit(0);
}
if (args.includes('--help') || args.includes('-h')) {
  console.log(`\nonyx-control v0.1.0\nONYX Sovereign AI OS — Terminal UI\n\nUsage:\n  onyx-control           Launch the interactive TUI\n  onyx-control --help    Show this help\n  onyx-control --version Show version\n\nEnv:\n  NERVE_PORT   nerve HTTP port (default: 3001)\n`);
  process.exit(0);
}

const { waitUntilExit } = render(<App />);
await waitUntilExit();