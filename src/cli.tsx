#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import os from 'os';
import fs from 'fs';
import { App } from './components/App.js';
import { expandPath } from './utils/paths.js';

const program = new Command();

program
  .name('source-agents')
  .description('Manage CLAUDE.md and AGENTS.md files with intelligent sourcing')
  .version('1.0.0')
  .option('-r, --root <directory>', 'Root directory to scan', os.homedir())
  .option('-e, --exclude <patterns...>', 'Additional exclude patterns')
  .option('-d, --dry-run', 'Preview changes without executing')
  .option('-a, --auto', 'Automatically apply recommended actions')
  .option('-v, --verbose', 'Show detailed output')
  .parse(process.argv);

const opts = program.opts();

const root = expandPath(opts.root || os.homedir());

// Validate root exists and is a directory before rendering the TUI
try {
  const stat = fs.statSync(root);
  if (!stat.isDirectory()) {
    console.error(`Error: --root path is not a directory: ${root}`);
    process.exit(1);
  }
} catch {
  console.error(`Error: --root path does not exist: ${root}`);
  process.exit(1);
}

const scanOptions = {
  root,
  exclude: opts.exclude || [],
  verbose: opts.verbose || false,
};

// Render the Ink app
render(
  <App
    options={scanOptions}
    dryRun={opts.dryRun || false}
    auto={opts.auto || false}
  />
);
