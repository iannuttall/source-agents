import fg from 'fast-glob';
import path from 'path';
import { ScanOptions, ScanResult, DirectoryInfo } from '../types/index.js';
import { analyzeDirectory } from './analyzer.js';

const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.vscode/**',
  '**/.idea/**',
  '**/target/**',
  '**/__pycache__/**',
  '**/.pytest_cache/**',
  '**/venv/**',
  '**/.venv/**',
];

export async function scanDirectories(options: ScanOptions): Promise<ScanResult> {
  const startTime = Date.now();
  const excludePatterns = [...DEFAULT_EXCLUDE, ...(options.exclude || [])];

  // Find all CLAUDE.md and AGENTS.md files
  const files = await fg(['**/CLAUDE.md', '**/AGENTS.md'], {
    cwd: options.root,
    absolute: true,
    ignore: excludePatterns,
    onlyFiles: true,
    followSymbolicLinks: false,
  });

  // Group files by directory
  const dirMap = new Map<string, Set<string>>();
  for (const file of files) {
    const dir = path.dirname(file);
    if (!dirMap.has(dir)) {
      dirMap.set(dir, new Set());
    }
    dirMap.get(dir)!.add(path.basename(file));
  }

  // Analyze each directory
  const directories: DirectoryInfo[] = [];
  for (const [dir] of dirMap) {
    const info = await analyzeDirectory(dir);
    directories.push(info);
  }

  // Sort by path for consistent display
  directories.sort((a, b) => a.path.localeCompare(b.path));

  const duration = Date.now() - startTime;

  return {
    directories,
    totalScanned: dirMap.size,
    duration,
  };
}
