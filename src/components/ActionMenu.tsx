import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { DirectoryInfo, Action, ActionType } from '../types/index.js';
import { shortenPath } from '../utils/paths.js';

interface ActionMenuProps {
  directory: DirectoryInfo;
  onSelect: (action: Action) => void;
  onSkip: () => void;
  onBack: () => void;
  onExit: () => void; // exit to main list
  canGoBack: boolean;
}

interface ActionOption {
  type: ActionType;
  label: string;
  description: string;
  recommended?: boolean;
}

function getActionOptions(dir: DirectoryInfo): ActionOption[] {
  const options: ActionOption[] = [];

  switch (dir.scenario) {
    case 'optimal':
      options.push({
        type: 'do-nothing',
        label: 'No action needed',
        description: 'Both files exist and CLAUDE.md sources AGENTS.md',
        recommended: true,
      });
      break;

    case 'both-no-source':
      options.push(
        {
          type: 'add-source-to-claude',
          label: 'Add @AGENTS.md to CLAUDE.md',
          description: 'Add sourcing directive to existing CLAUDE.md',
          recommended: true,
        },
        {
          type: 'do-nothing',
          label: 'Leave as-is',
          description: 'Keep custom setup without sourcing',
        }
      );
      break;

    case 'only-claude':
      options.push(
        {
          type: 'create-agents-empty',
          label: 'Create empty AGENTS.md',
          description: 'Create empty AGENTS.md, add @AGENTS.md to CLAUDE.md',
          recommended: true,
        },
        {
          type: 'create-agents-from-claude',
          label: 'Move content to AGENTS.md',
          description: 'Move CLAUDE.md content to AGENTS.md and add sourcing',
        },
        {
          type: 'do-nothing',
          label: 'Keep CLAUDE.md only',
          description: 'No changes',
        }
      );
      break;

    case 'only-agents':
      options.push(
        {
          type: 'create-claude-sourcing',
          label: 'Create CLAUDE.md with sourcing',
          description: 'Create CLAUDE.md that sources AGENTS.md',
          recommended: true,
        },
        {
          type: 'create-claude-empty',
          label: 'Create empty CLAUDE.md',
          description: 'Create empty CLAUDE.md without sourcing',
        },
        {
          type: 'do-nothing',
          label: 'Keep AGENTS.md only',
          description: 'No changes',
        }
      );
      break;

    case 'both-symlinks':
    case 'mixed-symlinks':
      options.push(
        {
          type: 'convert-symlinks',
          label: 'Convert symlinks to real files',
          description: 'Replace symlinks with real files',
          recommended: true,
        },
        {
          type: 'do-nothing',
          label: 'Keep symlinks',
          description: 'No changes',
        }
      );
      break;

    case 'broken-symlinks':
      options.push(
        {
          type: 'remove-broken',
          label: 'Remove broken symlinks',
          description: 'Delete broken symbolic links',
          recommended: true,
        },
        {
          type: 'review-manually',
          label: 'Review manually',
          description: 'Skip automated fix',
        }
      );
      break;

    default:
      options.push({
        type: 'review-manually',
        label: 'Review manually',
        description: 'Requires manual review',
        recommended: true,
      });
  }

  return options;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ directory, onSelect, onSkip, onBack, onExit, canGoBack }) => {
  const options = getActionOptions(directory);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const selected = options[selectedIndex];
      onSelect({
        type: selected.type,
        directory: directory.path,
        description: selected.description,
        recommended: selected.recommended || false,
      });
    } else if (input === 's' || input === 'S') {
      onSkip();
    } else if (key.leftArrow && canGoBack) {
      onBack();
    } else if (key.escape) {
      onExit();
    }
  });

  const displayPath = shortenPath(directory.path, 60);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {displayPath}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="dim">
          AGENTS: <Text color={directory.agentsStatus === 'exists' ? 'green' : 'red'}>{directory.agentsStatus}</Text>
          {' | '}
          CLAUDE: <Text color={directory.claudeStatus === 'sourcing' ? 'cyan' : directory.claudeStatus === 'exists' ? 'green' : 'red'}>{directory.claudeStatus}</Text>
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>Choose an action:</Text>
      </Box>

      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? '❯ ' : '  ';
        const recommendedBadge = option.recommended ? ' [recommended]' : '';

        return (
          <Box key={index}>
            <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
              {prefix}{option.label}{recommendedBadge}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text color="dim">
          ↑↓ navigate • Enter select • 's' skip{canGoBack ? ' • ← prev' : ''} • Esc list
        </Text>
      </Box>
    </Box>
  );
};
