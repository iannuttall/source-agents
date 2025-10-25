import React from 'react';
import { Box, Text } from 'ink';
import { DirectoryInfo, FileStatus } from '../types/index.js';
import { shortenPath } from '../utils/paths.js';

interface ResultsTableProps {
  directories: DirectoryInfo[];
  maxPathWidth?: number;
}

function getStatusColor(status: FileStatus): string {
  switch (status) {
    case 'exists':
      return 'green';
    case 'sourcing':
      return 'cyan';
    case 'symlink':
      return 'blue';
    case 'missing':
      return 'red';
    case 'broken':
      return 'red';
    default:
      return 'white';
  }
}

function getActionIndicator(needsAction: boolean): { symbol: string; color: string } {
  return needsAction
    ? { symbol: '⚠', color: 'yellow' }
    : { symbol: '✓', color: 'green' };
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ directories, maxPathWidth = 50 }) => {
  if (directories.length === 0) {
    return (
      <Box paddingY={1}>
        <Text color="dim">No directories found with CLAUDE.md or AGENTS.md files.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      {/* Header */}
      <Box>
        <Box width={3}>
          <Text bold> </Text>
        </Box>
        <Box width={maxPathWidth}>
          <Text bold>DIRECTORY</Text>
        </Box>
        <Box width={15}>
          <Text bold>AGENTS.md</Text>
        </Box>
        <Box width={15}>
          <Text bold>CLAUDE.md</Text>
        </Box>
      </Box>

      {/* Separator */}
      <Box>
        <Box width={3}>
          <Text>{'─'.repeat(3)}</Text>
        </Box>
        <Box width={maxPathWidth}>
          <Text>{'─'.repeat(maxPathWidth)}</Text>
        </Box>
        <Box width={15}>
          <Text>{'─'.repeat(15)}</Text>
        </Box>
        <Box width={15}>
          <Text>{'─'.repeat(15)}</Text>
        </Box>
      </Box>

      {/* Rows */}
      {directories.map((dir, index) => {
        const indicator = getActionIndicator(dir.needsAction);
        const displayPath = shortenPath(dir.path, maxPathWidth - 2);

        return (
          <Box key={index}>
            <Box width={3}>
              <Text color={indicator.color}>{indicator.symbol}</Text>
            </Box>
            <Box width={maxPathWidth}>
              <Text color="dim">{displayPath}</Text>
            </Box>
            <Box width={15}>
              <Text color={getStatusColor(dir.agentsStatus)}>{dir.agentsStatus}</Text>
            </Box>
            <Box width={15}>
              <Text color={getStatusColor(dir.claudeStatus)}>{dir.claudeStatus}</Text>
            </Box>
          </Box>
        );
      })}

      {/* Summary */}
      <Box paddingTop={1}>
        <Text>
          Found <Text bold color="cyan">{directories.length}</Text> {directories.length === 1 ? 'directory' : 'directories'}
          {' - '}
          <Text bold color="yellow">{directories.filter(d => d.needsAction).length}</Text> need attention
        </Text>
      </Box>
    </Box>
  );
};
