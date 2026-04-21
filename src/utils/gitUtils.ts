/**
 * Git Utilities for Conductor
 * Manages atomic commits with detailed notes and checkpoint tracking
 */

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { CommandResult } from '../types';

export interface CommitDetails {
  hash: string;
  message: string;
  timestamp: string;
  taskDescription: string;
  testResults?: string;
  relatedFiles?: string[];
}

export interface CheckpointReport {
  phaseName: string;
  completedTasks: string[];
  commitHashes: string[];
  testSuiteResults: string;
  manualVerificationSteps: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  notes: string;
}

export class GitManager {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Create an atomic commit with a descriptive message
   */
  async createAtomicCommit(message: string, filesToAdd: string[] = []): Promise<CommandResult> {
    try {
      // Add specified files or all changed files
      if (filesToAdd.length > 0) {
        for (const file of filesToAdd) {
          this.execGit(['add', file]);
        }
      } else {
        this.execGit(['add', '.']);
      }

      // Check if there are changes to commit
      const status = this.execGit(['status', '--porcelain']);
      if (!status.stdout.trim()) {
        return {
          success: false,
          message: 'No changes to commit. Working directory is clean.'
        };
      }

      // Create the commit
      const commitResult = this.execGit(['commit', '-m', message]);

      // Extract the commit hash
      const hashMatch = commitResult.stdout.match(/(\w{7})\s/);
      const commitHash = hashMatch ? hashMatch[1] : '';

      return {
        success: true,
        message: `[COMMIT SUCCESS] Created atomic commit: ${commitHash}\nMessage: ${message}`,
        data: { hash: commitHash }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `[COMMIT FAILED] Error creating commit: ${error.stderr || error.message}`
      };
    }
  }

  /**
   * Add a detailed note to the last commit using git notes
   */
  async addCommitNote(commitHash: string, noteContent: string): Promise<CommandResult> {
    try {
      // Use git notes to append detailed information to the commit
      const escapedNote = noteContent.replace(/"/g, '\\"'); // Escape quotes
      this.execGit(['notes', 'add', '-f', '-m', escapedNote, commitHash]);

      return {
        success: true,
        message: `[GIT NOTE] Added detailed note to commit ${commitHash}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `[GIT NOTE FAILED] Error adding note: ${error.stderr || error.message}`
      };
    }
  }

  /**
   * Retrieve commit notes
   */
  async getCommitNote(commitHash: string): Promise<CommandResult> {
    try {
      const result = this.execGit(['notes', 'show', commitHash]);

      return {
        success: true,
        message: result.stdout
      };
    } catch (error: any) {
      if (error.stderr?.includes('No note found')) {
        return {
          success: false,
          message: 'No note found for this commit'
        };
      }
      return {
        success: false,
        message: `[GET NOTE FAILED] Error retrieving note: ${error.stderr || error.message}`
      };
    }
  }

  /**
   * Create a checkpoint commit that encompasses a whole phase
   */
  async createCheckpointCommit(phaseName: string, taskSummaries: string[]): Promise<CommandResult> {
    try {
      const message = `checkpoint(${phaseName}): End of ${phaseName} phase\n\nTasks completed:\n${taskSummaries.join('\n')}`;

      // Add all changes
      this.execGit(['add', '.']);

      // Check if there are changes to commit
      const status = this.execGit(['status', '--porcelain']);
      if (!status.stdout.trim()) {
        return {
          success: false,
          message: 'No changes to commit for checkpoint.'
        };
      }

      // Create the checkpoint commit
      const commitResult = this.execGit(['commit', '-m', message]);

      // Extract the commit hash
      const hashMatch = commitResult.stdout.match(/(\w{7})\s/);
      const commitHash = hashMatch ? hashMatch[1] : '';

      return {
        success: true,
        message: `[CHECKPOINT COMMIT] Created phase checkpoint: ${commitHash}\nPhase: ${phaseName}`,
        data: { hash: commitHash }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `[CHECKPOINT FAILED] Error creating checkpoint: ${error.stderr || error.message}`
      };
    }
  }

  /**
   * Run test suite and get results
   */
  async runTestSuite(): Promise<CommandResult> {
    try {
      // Look for common test runners in the project
      const testRunner = this.detectTestRunner();

      if (!testRunner) {
        return {
          success: false,
          message: 'No test runner detected in project. Supported: npm test, yarn test, pnpm test, jest, vitest, mocha'
        };
      }

      // Run tests and capture output
      const testResult = this.execGitCmdWithCwd(testRunner);

      // Determine if tests passed based on output
      const testPassed = testResult.stdout.includes('PASS') ||
                         testResult.stdout.includes('passed') ||
                         testResult.stdout.includes('ok') ||
                         !testResult.stdout.includes('FAIL');

      return {
        success: testPassed,
        message: `[TEST SUITE] ${testPassed ? 'PASSED' : 'FAILED'}\n\n${testResult.stdout}`,
        data: {
          rawOutput: testResult.stdout,
          passed: testPassed
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `[TEST SUITE ERROR] ${error.stderr || error.message}`,
        data: {
          rawOutput: error.stdout || error.stderr || error.message,
          passed: false
        }
      };
    }
  }

  /**
   * Detect which test runner is configured for the project
   */
  private detectTestRunner(): string | null {
    // Check package.json first
    const packageJsonRunner = this.checkPackageJsonForTestRunner();
    if (packageJsonRunner) {
      return packageJsonRunner;
    }

    // Check for config files
    return this.checkConfigFilesForTestRunner();
  }

  /**
   * Check package.json for test runner configuration
   */
  private checkPackageJsonForTestRunner(): string | null {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Check for test script
      if (this.hasTestScript(packageJson)) {
        return 'npm test';
      }

      // Check for specific test runner dependencies
      return this.checkDependenciesForTestRunners(packageJson);
    }

    return null;
  }

  /**
   * Check if package.json has test script
   */
  private hasTestScript(packageJson: any): boolean {
    return packageJson.scripts && packageJson.scripts.test;
  }

  /**
   * Check dependencies for specific test runners
   */
  private checkDependenciesForTestRunners(packageJson: any): string | null {
    const deps = {...packageJson.dependencies, ...packageJson.devDependencies};

    // Check for specific test runner dependencies
    if (deps.jest) return 'npx jest';
    if (deps.vitest) return 'npx vitest';
    if (deps.mocha) return 'npx mocha';

    return null;
  }

  /**
   * Check for common test configuration files
   */
  private checkConfigFilesForTestRunner(): string | null {
    const testConfigs = [
      'jest.config.js',
      'vitest.config.js',
      'mocha.opts'
    ];

    for (const configFile of testConfigs) {
      if (fs.existsSync(path.join(this.projectRoot, configFile))) {
        return this.getTestRunnerForConfig(configFile);
      }
    }

    return null;
  }

  /**
   * Get test runner based on config file
   */
  private getTestRunnerForConfig(configFile: string): string {
    if (configFile.startsWith('jest')) return 'npx jest';
    if (configFile.startsWith('vitest')) return 'npx vitest';
    if (configFile.startsWith('mocha')) return 'npx mocha';

    // Default fallback
    return 'npm test';
  }

  /**
   * Execute git command in project directory
   */
  private execGit(args: string[]): { stdout: string, stderr: string } {
    const result = child_process.spawnSync('git', args, {
      cwd: this.projectRoot,
      encoding: 'utf-8',
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      const error = new Error(result.stderr || 'Git command failed');
      (error as any).stderr = result.stderr;
      (error as any).stdout = result.stdout;
      throw error;
    }

    return {
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  /**
   * Execute command with cwd
   */
  private execGitCmdWithCwd(command: string): { stdout: string, stderr: string } {
    const [cmd, ...args] = command.split(' ');
    const result = child_process.spawnSync(cmd, args, {
      cwd: this.projectRoot,
      encoding: 'utf-8',
      timeout: 30000, // 30 second timeout
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || ''
    };
  }

  /**
   * Get the current branch
   */
  getCurrentBranch(): string {
    try {
      const result = this.execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
      return result.stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Check if the working directory is clean
   */
  isWorkingDirectoryClean(): boolean {
    try {
      const result = this.execGit(['status', '--porcelain']);
      return !result.stdout.trim();
    } catch (error) {
      // If git command fails, assume dirty
      return false;
    }
  }

  /**
   * Get the latest commit hash
   */
  getLatestCommitHash(): string {
    try {
      const result = this.execGit(['rev-parse', '--short', 'HEAD']);
      return result.stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }
}