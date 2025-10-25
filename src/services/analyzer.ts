import fs from 'fs-extra';
import path from 'path';
import { DirectoryInfo, FileStatus, Scenario } from '../types/index.js';

async function getFileStatus(filePath: string): Promise<FileStatus> {
  try {
    const stats = await fs.lstat(filePath);

    if (stats.isSymbolicLink()) {
      // Check if symlink is broken
      try {
        await fs.access(filePath);
        return 'symlink';
      } catch {
        return 'broken';
      }
    }

    if (stats.isFile()) {
      return 'exists';
    }

    return 'missing';
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return 'missing';
    }
    throw error;
  }
}

async function checkIfClaudeSources(claudePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(claudePath, 'utf-8');
    // Check if CLAUDE.md contains @AGENTS.md sourcing directive
    return content.includes('@AGENTS.md');
  } catch {
    return false;
  }
}

function determineScenario(
  agentsStatus: FileStatus,
  claudeStatus: FileStatus,
  claudeSources: boolean
): Scenario {
  const claudeExists = claudeStatus === 'exists' || claudeStatus === 'sourcing';

  // Both exist and CLAUDE sources AGENTS - optimal
  if (agentsStatus === 'exists' && claudeExists && claudeSources) {
    return 'optimal';
  }

  // Both exist but CLAUDE doesn't source AGENTS
  if (agentsStatus === 'exists' && claudeExists && !claudeSources) {
    return 'both-no-source';
  }

  // Only CLAUDE exists
  if (claudeExists && agentsStatus === 'missing') {
    return 'only-claude';
  }

  // Only AGENTS exists
  if (agentsStatus === 'exists' && claudeStatus === 'missing') {
    return 'only-agents';
  }

  // Both are symlinks
  if (agentsStatus === 'symlink' && claudeStatus === 'symlink') {
    return 'both-symlinks';
  }

  // Mixed symlinks
  if (
    (agentsStatus === 'symlink' && claudeStatus === 'exists') ||
    (agentsStatus === 'exists' && claudeStatus === 'symlink')
  ) {
    return 'mixed-symlinks';
  }

  // Broken symlinks
  if (agentsStatus === 'broken' || claudeStatus === 'broken') {
    return 'broken-symlinks';
  }

  // Default case
  return 'both-no-source';
}

export async function analyzeDirectory(dirPath: string): Promise<DirectoryInfo> {
  const agentsPath = path.join(dirPath, 'AGENTS.md');
  const claudePath = path.join(dirPath, 'CLAUDE.md');

  const agentsStatus = await getFileStatus(agentsPath);
  let claudeStatus = await getFileStatus(claudePath);

  // Check if CLAUDE.md sources AGENTS.md
  const claudeSources = claudeStatus === 'exists' ? await checkIfClaudeSources(claudePath) : false;

  // Update claudeStatus to 'sourcing' if it sources AGENTS.md
  if (claudeStatus === 'exists' && claudeSources) {
    claudeStatus = 'sourcing';
  }

  const scenario = determineScenario(agentsStatus, claudeStatus, claudeSources);
  const needsAction = scenario !== 'optimal';

  return {
    path: dirPath,
    agentsStatus,
    claudeStatus,
    needsAction,
    scenario,
  };
}
