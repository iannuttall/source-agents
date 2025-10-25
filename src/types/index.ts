export type FileStatus = 'exists' | 'missing' | 'symlink' | 'broken' | 'sourcing';

export interface DirectoryInfo {
  path: string;
  agentsStatus: FileStatus;
  claudeStatus: FileStatus;
  needsAction: boolean;
  scenario: Scenario;
}

export type Scenario =
  | 'optimal'           // Both exist, CLAUDE sources AGENTS
  | 'both-no-source'    // Both exist, CLAUDE doesn't source AGENTS
  | 'only-claude'       // Only CLAUDE.md exists
  | 'only-agents'       // Only AGENTS.md exists
  | 'both-symlinks'     // Both are symlinks (legacy)
  | 'mixed-symlinks'    // One symlink, one regular
  | 'broken-symlinks';  // Has broken symlinks

export type ActionType =
  | 'create-agents-empty'
  | 'create-agents-from-claude'
  | 'create-claude-sourcing'
  | 'create-claude-empty'
  | 'add-source-to-claude'
  | 'convert-symlinks'
  | 'remove-broken'
  | 'do-nothing'
  | 'review-manually';

export interface Action {
  type: ActionType;
  directory: string;
  description: string;
  recommended: boolean;
}

export interface ScanOptions {
  root: string;
  exclude?: string[];
  verbose?: boolean;
}

export interface ScanResult {
  directories: DirectoryInfo[];
  totalScanned: number;
  duration: number;
}
