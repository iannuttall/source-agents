import os from 'os';
import path from 'path';

export function shortenPath(fullPath: string, maxLength: number): string {
  const homeDir = os.homedir();
  let displayPath = fullPath.startsWith(homeDir)
    ? `~${fullPath.slice(homeDir.length)}`
    : fullPath;

  if (displayPath.length <= maxLength) {
    return displayPath;
  }

  // Truncate with ellipsis
  if (maxLength <= 3) {
    return displayPath.slice(0, 1);
  }

  return displayPath.slice(0, maxLength - 3) + '...';
}

export function expandPath(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  return path.resolve(inputPath);
}
