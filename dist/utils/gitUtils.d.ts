/**
 * Git Utilities for Conductor
 * Manages atomic commits with detailed notes and checkpoint tracking
 */
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
export declare class GitManager {
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Create an atomic commit with a descriptive message
     */
    createAtomicCommit(message: string, filesToAdd?: string[]): Promise<CommandResult>;
    /**
     * Add a detailed note to the last commit using git notes
     */
    addCommitNote(commitHash: string, noteContent: string): Promise<CommandResult>;
    /**
     * Retrieve commit notes
     */
    getCommitNote(commitHash: string): Promise<CommandResult>;
    /**
     * Create a checkpoint commit that encompasses a whole phase
     */
    createCheckpointCommit(phaseName: string, taskSummaries: string[]): Promise<CommandResult>;
    /**
     * Run test suite and get results
     */
    runTestSuite(): Promise<CommandResult>;
    /**
     * Detect which test runner is configured for the project
     */
    private detectTestRunner;
    /**
     * Check package.json for test runner configuration
     */
    private checkPackageJsonForTestRunner;
    /**
     * Check if package.json has test script
     */
    private hasTestScript;
    /**
     * Check dependencies for specific test runners
     */
    private checkDependenciesForTestRunners;
    /**
     * Check for common test configuration files
     */
    private checkConfigFilesForTestRunner;
    /**
     * Get test runner based on config file
     */
    private getTestRunnerForConfig;
    /**
     * Execute git command in project directory
     */
    private execGit;
    /**
     * Execute command with cwd
     */
    private execGitCmdWithCwd;
    /**
     * Generic command executor
     */
    private execCommand;
    /**
     * Get the current branch
     */
    getCurrentBranch(): string;
    /**
     * Check if the working directory is clean
     */
    isWorkingDirectoryClean(): boolean;
    /**
     * Get the latest commit hash
     */
    getLatestCommitHash(): string;
}
