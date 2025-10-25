import fs from 'fs-extra';
import path from 'path';
import { Action, ActionType } from '../types/index.js';
import { AGENTS_TEMPLATE, CLAUDE_TEMPLATE, CLAUDE_SOURCING_ONLY } from '../utils/templates.js';

const SOURCING_DIRECTIVE = '@AGENTS.md\n\n';

export async function executeAction(action: Action, dryRun: boolean = false): Promise<string> {
  const agentsPath = path.join(action.directory, 'AGENTS.md');
  const claudePath = path.join(action.directory, 'CLAUDE.md');

  if (dryRun) {
    return `[DRY RUN] ${action.description}`;
  }

  try {
    switch (action.type) {
      case 'create-agents-empty':
        await fs.writeFile(agentsPath, AGENTS_TEMPLATE);
        // Ensure CLAUDE.md sources AGENTS.md without altering existing content
        try {
          let existingClaude = await fs.readFile(claudePath, 'utf-8');
          if (!existingClaude.includes('@AGENTS.md')) {
            await fs.writeFile(claudePath, SOURCING_DIRECTIVE + existingClaude);
          }
        } catch {
          // CLAUDE.md may not exist; that's fine in some scenarios
        }
        return `Created empty AGENTS.md and ensured CLAUDE.md sources it`;

      case 'create-agents-from-claude':
        const claudeContent = await fs.readFile(claudePath, 'utf-8');
        await fs.writeFile(agentsPath, claudeContent);
        await fs.writeFile(claudePath, SOURCING_DIRECTIVE);
        return `Moved content from CLAUDE.md to AGENTS.md and added sourcing`;

      case 'create-claude-sourcing':
        await fs.writeFile(claudePath, CLAUDE_SOURCING_ONLY);
        return `Created CLAUDE.md with @AGENTS.md sourcing`;

      case 'create-claude-empty':
        await fs.writeFile(claudePath, CLAUDE_TEMPLATE);
        return `Created empty CLAUDE.md`;

      case 'add-source-to-claude':
        let content = await fs.readFile(claudePath, 'utf-8');
        // Add sourcing directive at the top if not already present
        if (!content.includes('@AGENTS.md')) {
          content = SOURCING_DIRECTIVE + content;
          await fs.writeFile(claudePath, content);
          return `Added @AGENTS.md sourcing to CLAUDE.md`;
        }
        return `CLAUDE.md already sources AGENTS.md`;

      case 'convert-symlinks':
        const results: string[] = [];

        // Handle AGENTS.md symlink
        const agentsStats = await fs.lstat(agentsPath).catch(() => null);
        if (agentsStats?.isSymbolicLink()) {
          const target = await fs.readlink(agentsPath);
          const targetPath = path.resolve(path.dirname(agentsPath), target);
          const targetContent = await fs.readFile(targetPath, 'utf-8');
          await fs.unlink(agentsPath);
          await fs.writeFile(agentsPath, targetContent);
          results.push('Converted AGENTS.md symlink to real file');
        }

        // Handle CLAUDE.md symlink
        const claudeStats = await fs.lstat(claudePath).catch(() => null);
        if (claudeStats?.isSymbolicLink()) {
          const target = await fs.readlink(claudePath);
          const targetPath = path.resolve(path.dirname(claudePath), target);
          const targetContent = await fs.readFile(targetPath, 'utf-8');
          await fs.unlink(claudePath);
          await fs.writeFile(claudePath, targetContent);
          results.push('Converted CLAUDE.md symlink to real file');
        }

        return results.join('; ') || 'No symlinks to convert';

      case 'remove-broken':
        const removed: string[] = [];

        // Check and remove broken AGENTS.md
        try {
          const aStats = await fs.lstat(agentsPath);
          if (aStats.isSymbolicLink()) {
            try {
              await fs.access(agentsPath);
            } catch {
              await fs.unlink(agentsPath);
              removed.push('AGENTS.md');
            }
          }
        } catch {}

        // Check and remove broken CLAUDE.md
        try {
          const cStats = await fs.lstat(claudePath);
          if (cStats.isSymbolicLink()) {
            try {
              await fs.access(claudePath);
            } catch {
              await fs.unlink(claudePath);
              removed.push('CLAUDE.md');
            }
          }
        } catch {}

        return removed.length > 0
          ? `Removed broken symlinks: ${removed.join(', ')}`
          : 'No broken symlinks found';

      case 'do-nothing':
        return 'No changes made';

      case 'review-manually':
        return 'Skipped - requires manual review';

      default:
        return `Unknown action type: ${action.type}`;
    }
  } catch (error: any) {
    throw new Error(`Failed to execute action: ${error.message}`);
  }
}

export async function executeActions(
  actions: Action[],
  dryRun: boolean = false,
  onProgress?: (index: number, total: number, message: string) => void
): Promise<Map<string, { success: boolean; message: string }>> {
  const results = new Map<string, { success: boolean; message: string }>();

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (onProgress) {
      onProgress(i + 1, actions.length, `Processing ${path.basename(action.directory)}...`);
    }

    try {
      const message = await executeAction(action, dryRun);
      results.set(action.directory, { success: true, message });
    } catch (error: any) {
      results.set(action.directory, { success: false, message: error.message });
    }
  }

  return results;
}
