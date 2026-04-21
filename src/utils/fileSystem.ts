/**
 * File system utilities for Conductor
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export const CONDUCTOR_DIR = 'conductor';
export const TRACKS_FILE = 'index.md';

export function resolveConductorDir(startPath: string): string {
  let currentPath = startPath;
  
  while (currentPath !== path.parse(currentPath).root) {
    const conductorPath = path.join(currentPath, 'conductor');
    if (fs.existsSync(conductorPath) && fs.statSync(conductorPath).isDirectory()) {
      return conductorPath;
    }
    currentPath = path.dirname(currentPath);
  }

  // Final check at root
  const rootConductor = path.join(currentPath, 'conductor');
  if (fs.existsSync(rootConductor) && fs.statSync(rootConductor).isDirectory()) {
    return rootConductor;
  }

  return path.join(startPath, 'conductor'); // Default fallback
}

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

export function readFile(filePath: string): string | null {
  try {
    if (!fileExists(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function writeFile(filePath: string, content: string): void {
  try {
    ensureDir(path.dirname(filePath));
    // Sanitize: Remove NULL bytes and trim to prevent 'Binary File' corruption
    const cleanContent = content.replace(/\0/g, '').trim();
    fs.writeFileSync(filePath, cleanContent, 'utf-8');
  } catch (error) {
    console.error(`Error writing to file ${filePath}: ${error}`);
  }
}

export function readJsonFile<T>(filePath: string): T | null {
  const content = readFile(filePath);
  if (!content) {
    return null;
  }
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  writeFile(filePath, JSON.stringify(data, null, 2));
}

export function listFiles(dirPath: string, extension?: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const files = fs.readdirSync(dirPath);
  if (extension) {
    return files.filter((f: string) => f.endsWith(extension));
  }
  return files;
}

export function listDirectories(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath)
    .filter((f: string) => fs.statSync(path.join(dirPath, f)).isDirectory());
}

export function execCommand(command: string, cwd: string): string | null {
  try {
    return execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' });
  } catch {
    return null;
  }
}
