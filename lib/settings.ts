import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DIR = join(process.cwd(), '.ab-engine');
const FILE = join(DIR, 'settings.json');

export interface AppSettings {
  githubToken?: string;
  githubRepo?: string;   // "owner/repo"
  githubBranch?: string; // target branch for PRs, default "main"
}

export function getSettings(): AppSettings {
  try {
    if (!existsSync(FILE)) return {};
    return JSON.parse(readFileSync(FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveSettings(settings: AppSettings): void {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(settings, null, 2));
}
