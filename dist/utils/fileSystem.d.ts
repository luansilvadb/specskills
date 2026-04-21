/**
 * File system utilities for Conductor
 */
export declare const CONDUCTOR_DIR = "conductor";
export declare const TRACKS_FILE = "index.md";
export declare function resolveConductorDir(startPath: string): string;
export declare function ensureDir(dirPath: string): void;
export declare function fileExists(filePath: string): boolean;
export declare function readFile(filePath: string): string | null;
export declare function writeFile(filePath: string, content: string): void;
export declare function readJsonFile<T>(filePath: string): T | null;
export declare function writeJsonFile(filePath: string, data: unknown): void;
export declare function listFiles(dirPath: string, extension?: string): string[];
export declare function listDirectories(dirPath: string): string[];
export declare function execCommand(command: string, cwd: string): string | null;
