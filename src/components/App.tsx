import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Scanner } from './Scanner.js';
import { ResultsTable } from './ResultsTable.js';
import { ActionMenu } from './ActionMenu.js';
import { Summary } from './Summary.js';
import { scanDirectories } from '../services/scanner.js';
import { executeAction } from '../services/executor.js';
import { analyzeDirectory } from '../services/analyzer.js';
import { DirectoryInfo, Action, ScanOptions } from '../types/index.js';

interface AppProps {
  options: ScanOptions;
  dryRun?: boolean;
  auto?: boolean;
}

type AppState = 'scanning' | 'displaying' | 'selecting' | 'executing' | 'complete';

export const App: React.FC<AppProps> = ({ options, dryRun = false, auto = false }) => {
  const [state, setState] = useState<AppState>('scanning');
  const [directories, setDirectories] = useState<DirectoryInfo[]>([]);
  const [currentDirIndex, setCurrentDirIndex] = useState(0);
  const [actions, setActions] = useState<Action[]>([]);
  const [results, setResults] = useState<Map<string, { success: boolean; message: string }>>(
    new Map()
  );
  const [error, setError] = useState<string | null>(null);

  // Initial scan
  useEffect(() => {
    const doScan = async () => {
      try {
        const scanResult = await scanDirectories(options);
        setDirectories(scanResult.directories);

        if (scanResult.directories.length === 0) {
          setState('complete');
          return;
        }

        const needsAction = scanResult.directories.filter((d) => d.needsAction);

        if (needsAction.length === 0) {
          setState('displaying');
          setTimeout(() => setState('complete'), 2000);
          return;
        }

        if (auto) {
          // Auto mode: apply recommended actions
          const autoActions = needsAction.map((dir) =>
            getRecommendedAction(dir)
          );
          setActions(autoActions);
          setState('executing');
        } else {
          setState('displaying');
        }
      } catch (err: any) {
        setError(err.message);
        setState('complete');
      }
    };

    doScan();
  }, [options, auto]);

  // Execute actions
  useEffect(() => {
    if (state === 'executing' && actions.length > 0) {
      const execute = async () => {
        const newResults = new Map<string, { success: boolean; message: string }>();

        for (const action of actions) {
          try {
            const message = await executeAction(action, dryRun);
            newResults.set(action.directory, { success: true, message });
          } catch (err: any) {
            newResults.set(action.directory, { success: false, message: err.message });
          }
        }

        setResults(newResults);
        setState('complete');
      };

      execute();
    }
  }, [state, actions, dryRun]);

  const handleActionSelect = async (action: Action) => {
    // Treat no-op choices as resolved for this session
    if (action.type === 'do-nothing' || action.type === 'review-manually') {
      try {
        const message = await executeAction(action, dryRun);
        setResults((prev) => new Map(prev).set(action.directory, { success: true, message }));
      } catch (err: any) {
        setResults((prev) => new Map(prev).set(action.directory, { success: false, message: err.message }));
      }

      let updated: DirectoryInfo[] = [];
      setDirectories((prev) => {
        updated = prev.map((d) => (d.path === action.directory ? { ...d, needsAction: false } : d));
        return updated;
      });

      const remainingCount = updated.filter((d) => d.needsAction).length;
      const nextIdx = Math.max(0, Math.min(currentDirIndex, Math.max(remainingCount - 1, 0)));
      setCurrentDirIndex(nextIdx);
      setState(remainingCount === 0 ? 'complete' : 'selecting');
      return;
    }

    // Apply real changes immediately so the user sees results
    setState('executing');
    try {
      const message = await executeAction(action, dryRun);
      setResults((prev) => new Map(prev).set(action.directory, { success: true, message }));

      let nextDirs: DirectoryInfo[] = [];
      const refreshed = await analyzeDirectory(action.directory);
      setDirectories((prev) => {
        nextDirs = prev.map((d) => (d.path === action.directory ? refreshed : d));
        return nextDirs;
      });

      const needsAfter = nextDirs.filter((d) => d.needsAction);
      if (needsAfter.length === 0) {
        setState('complete');
      } else {
        const nextIdx = Math.max(0, Math.min(currentDirIndex, needsAfter.length - 1));
        setCurrentDirIndex(nextIdx);
        setState('selecting');
      }
    } catch (err: any) {
      setResults((prev) => new Map(prev).set(action.directory, { success: false, message: err.message }));
      setState('selecting');
    }
  };

  const handleSkip = () => {
    const needsAction = directories.filter((d) => d.needsAction);
    const nextIndex = currentDirIndex + 1;

    if (nextIndex >= needsAction.length) {
      if (actions.length > 0) {
        setState('executing');
      } else {
        setState('complete');
      }
    } else {
      setCurrentDirIndex(nextIndex);
    }
  };

  const handleBack = () => {
    if (currentDirIndex > 0) {
      // Remove the last action if we added one for the current directory
      const needsAction = directories.filter((d) => d.needsAction);
      const currentDir = needsAction[currentDirIndex];

      // Check if there's an action for the previous directory
      const previousDir = needsAction[currentDirIndex - 1];
      const hasActionForPrevious = actions.some(a => a.directory === previousDir.path);

      if (hasActionForPrevious) {
        // Remove the last action
        setActions(actions.slice(0, -1));
      }

      setCurrentDirIndex(currentDirIndex - 1);
    }
  };

  const handleExitToList = () => {
    // Return to the table view; discard any staged actions and reset index
    setActions([]);
    setCurrentDirIndex(0);
    setState('displaying');
  };

  // Handle input in displaying state to start interactive mode (only in interactive mode)
  useInput(
    (input, key) => {
      if (state === 'displaying') {
        const needsAction = directories.filter((d) => d.needsAction);
        if (needsAction.length > 0 && !key.escape && !key.ctrl && input !== 'c') {
          setState('selecting');
        }
      }
    },
    { isActive: !auto && state === 'displaying' }
  );

  if (error) {
    return (
      <Box paddingY={1}>
        <Text color="red" bold>
          Error: {error}
        </Text>
      </Box>
    );
  }

  if (state === 'scanning') {
    return <Scanner root={options.root} isScanning={true} />;
  }

  if (state === 'displaying') {
    const needsAction = directories.filter((d) => d.needsAction);

    return (
      <Box flexDirection="column">
        <ResultsTable directories={directories} />

        {needsAction.length > 0 && (
          <Box marginTop={1}>
            <Text>
              Press any key to start interactive mode, or Ctrl+C to exit...
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  if (state === 'selecting') {
    const needsAction = directories.filter((d) => d.needsAction);
    const currentDir = needsAction[currentDirIndex];

    if (!currentDir) {
      setState('complete');
      return null;
    }

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="dim">
            Directory {currentDirIndex + 1} of {needsAction.length}
          </Text>
        </Box>
        <ActionMenu
          directory={currentDir}
          onSelect={handleActionSelect}
          onSkip={handleSkip}
          onBack={handleBack}
          onExit={handleExitToList}
          canGoBack={currentDirIndex > 0}
        />
      </Box>
    );
  }

  if (state === 'executing') {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text>
          {dryRun ? '[DRY RUN] ' : ''}
          {actions.length > 0 ? `Executing ${actions.length} action${actions.length !== 1 ? 's' : ''}...` : 'Applying action...'}
        </Text>
      </Box>
    );
  }

  if (state === 'complete') {
    if (results.size > 0) {
      return <Summary results={results} />;
    }

    if (directories.length === 0) {
      return (
        <Box paddingY={1}>
          <Text color="yellow">No directories found with CLAUDE.md or AGENTS.md files.</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <ResultsTable directories={directories} />
        <Box marginTop={1}>
          <Text color="green">✓ All directories are in optimal state!</Text>
        </Box>
      </Box>
    );
  }

  return null;
};

function getRecommendedAction(dir: DirectoryInfo): Action {
  switch (dir.scenario) {
    case 'both-no-source':
      return {
        type: 'add-source-to-claude',
        directory: dir.path,
        description: 'Add @AGENTS.md to CLAUDE.md',
        recommended: true,
      };

    case 'only-claude':
      return {
        type: 'create-agents-from-claude',
        directory: dir.path,
        description: 'Move content to AGENTS.md',
        recommended: true,
      };

    case 'only-agents':
      return {
        type: 'create-claude-sourcing',
        directory: dir.path,
        description: 'Create CLAUDE.md with sourcing',
        recommended: true,
      };

    case 'both-symlinks':
    case 'mixed-symlinks':
      return {
        type: 'convert-symlinks',
        directory: dir.path,
        description: 'Convert symlinks to real files',
        recommended: true,
      };

    case 'broken-symlinks':
      return {
        type: 'remove-broken',
        directory: dir.path,
        description: 'Remove broken symlinks',
        recommended: true,
      };

    default:
      return {
        type: 'do-nothing',
        directory: dir.path,
        description: 'No action needed',
        recommended: true,
      };
  }
}
