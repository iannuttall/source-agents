import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ScannerProps {
  root: string;
  isScanning: boolean;
}

export const Scanner: React.FC<ScannerProps> = ({ root, isScanning }) => {
  if (!isScanning) {
    return null;
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Scanning {root}...</Text>
      </Box>
    </Box>
  );
};
