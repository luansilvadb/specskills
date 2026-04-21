import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { 
  resolveConductorDir, 
  ensureDir, 
  fileExists, 
  readFile, 
  writeFile,
  readJsonFile,
  listDirectories,
  listFiles
} from './fileSystem';

vi.mock('fs');

describe('FileSystem Utils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('resolveConductorDir', () => {
    it('should return conductor path if it exists', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isDirectory: () => true } as any);
      
      const result = resolveConductorDir('/project');
      expect(result).toBe(path.join('/project', 'conductor'));
    });
  });

  describe('ensureDir', () => {
    it('should create directory if it does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const mkdirSpy = vi.spyOn(fs, 'mkdirSync');
      
      ensureDir('/new-dir');
      expect(mkdirSpy).toHaveBeenCalledWith('/new-dir', { recursive: true });
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists and is a file', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true } as any);
      
      expect(fileExists('/file.txt')).toBe(true);
    });

    it('should return false if it is a directory', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => false } as any);
      
      expect(fileExists('/dir')).toBe(false);
    });
  });

  describe('readFile', () => {
    it('should return file content if it exists', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true } as any);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('hello');
      
      expect(readFile('/file.txt')).toBe('hello');
    });

    it('should return null if file does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(readFile('/missing.txt')).toBeNull();
    });
  });

  describe('writeFile', () => {
    it('should write file and ensure directory', () => {
      const writeSpy = vi.spyOn(fs, 'writeFileSync');
      vi.spyOn(fs, 'existsSync').mockReturnValue(true); // dir exists
      
      writeFile('/dir/file.txt', 'content');
      expect(writeSpy).toHaveBeenCalledWith('/dir/file.txt', 'content', 'utf-8');
    });
  });

  describe('readJsonFile', () => {
    it('should parse valid JSON', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true } as any);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('{"a":1}');
      
      expect(readJsonFile<{a:number}>('/f.json')).toEqual({a:1});
    });

    it('should return null for invalid JSON', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true } as any);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('invalid');
      
      expect(readJsonFile('/f.json')).toBeNull();
    });
  });

  describe('listDirectories', () => {
    it('should filter directories only', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readdirSync').mockReturnValue(['dir', 'file.txt'] as any);
      vi.spyOn(fs, 'statSync').mockImplementation((path) => {
        return { isDirectory: () => (path as string).includes('dir') } as any;
      });
      
      const dirs = listDirectories('/root');
      expect(dirs).toContain('dir');
      expect(dirs).not.toContain('file.txt');
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readdirSync').mockReturnValue(['f1.ts', 'f2.txt'] as any);
      
      expect(listFiles('/dir')).toHaveLength(2);
      expect(listFiles('/dir', '.ts')).toHaveLength(1);
    });
  });
});
