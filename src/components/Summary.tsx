import React from 'react';
import { Box, Text } from 'ink';
import { shortenPath } from '../utils/paths.js';

interface SummaryProps {
  results: Map<string, { success: boolean; message: string }>;
  maxPathWidth?: number;
  resultWidth?: number;
}

function truncateOneLine(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return clean.slice(0, Math.max(0, max - 3)) + '...';
}

export const Summary: React.FC<SummaryProps> = ({ results, maxPathWidth = 50, resultWidth = 60 }) => {
  const entries = Array.from(results.entries());
  const successful = entries.filter(([, r]) => r.success).length;
  const failed = entries.length - successful;

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Summary</Text>
      </Box>

      {/* Header */}
      <Box>
        <Box width={maxPathWidth}>
          <Text bold>DIRECTORY</Text>
        </Box>
        <Box width={resultWidth}>
          <Text bold>RESULT</Text>
        </Box>
      </Box>

      {/* Separator */}
      <Box>
        <Box width={maxPathWidth}>
          <Text>{'─'.repeat(maxPathWidth)}</Text>
        </Box>
        <Box width={resultWidth}>
          <Text>{'─'.repeat(resultWidth)}</Text>
        </Box>
      </Box>

      {/* Rows */}
      {entries.map(([dir, result], idx) => {
        const displayPath = shortenPath(dir, maxPathWidth - 2);
        const resultText = truncateOneLine(result.message, resultWidth - 2);

        const msg = result.message.toLowerCase();
        let resultColor: string = 'green';
        if (!result.success) {
          resultColor = 'red';
        } else if (msg.includes('[dry run]')) {
          resultColor = 'yellow';
        } else if (msg.includes('no changes') || msg.includes('already sources') || msg.includes('no symlinks')) {
          resultColor = 'gray';
        } else if (msg.includes('created')) {
          resultColor = 'cyan';
        } else if (msg.includes('added')) {
          resultColor = 'green';
        } else if (msg.includes('moved')) {
          resultColor = 'magenta';
        } else if (msg.includes('converted')) {
          resultColor = 'blue';
        } else if (msg.includes('removed')) {
          resultColor = 'yellow';
        }
        return (
          <Box key={idx}>
            <Box width={maxPathWidth}>
              <Text color="dim">{displayPath}</Text>
            </Box>
            <Box width={resultWidth}>
              <Text color={resultColor}>{resultText}</Text>
            </Box>
          </Box>
        );
      })}

      {/* Footer summary */}
      <Box marginTop={1}>
        <Text>
          Completed: <Text bold color="green">{successful}</Text> successful
          {failed > 0 && (<>{', '}<Text bold color="red">{failed}</Text> failed</>)}
        </Text>
      </Box>
    </Box>
  );
};
