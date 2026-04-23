/**
 * Task Execution Manager for Conductor
 * Handles atomic task execution with TDD workflow and phase verification
 */
import type { Task, CommandResult } from '../types';
export interface TaskExecutionContext {
    taskId: string;
    taskDescription: string;
    currentPhase: 'red' | 'green' | 'refactor';
    activeSkills?: any[];
    testResults?: TestResult;
    implementationStatus?: 'started' | 'completed';
    refactorNotes?: string;
}
export interface TestResult {
    passed: boolean;
    output?: string;
    errors?: string[];
}
export interface ManualTestPlan {
    testScenarios: TestScenario[];
    acceptanceCriteria: string[];
    verificationSteps: string[];
}
export interface TestScenario {
    description: string;
    steps: string[];
    expectedResult: string;
    actualResult?: string;
    passed?: boolean;
}
export declare class TaskExecutionManager {
    /**
     * Execute a single task atomically following TDD workflow
     */
    executeTaskAtomically(task: Task, trackDir: string, activeSkills?: any[]): Promise<CommandResult>;
    /**
     * Execute the Red phase: Write failing tests
     */
    private executeRedPhase;
    /**
     * Attempt to debug and fix implementation issues automatically
     */
    private attemptDebugAndFix;
    /**
     * Execute the Green phase: Implement functionality to pass tests
     */
    private executeGreenPhase;
    /**
     * Initialize the green phase by running initial tests
     */
    private initializeGreenPhase;
    /**
     * Handle initial implementation attempt if tests don't pass
     */
    private handleImplementationAttempt;
    /**
     * Handle debugging attempts when implementation doesn't pass tests
     */
    private handleDebuggingAttempts;
    /**
     * Create failure result for debugging attempt
     */
    private createDebugFailureResult;
    /**
     * Create the test result context
     */
    private createTestResultContext;
    /**
     * Create successful green phase response
     */
    private createSuccessfulGreenPhaseResponse;
    /**
     * Create failed green phase response
     */
    private createFailedGreenPhaseResponse;
    /**
     * Execute the Refactor phase: Clean up and optimize code
     */
    private executeRefactorPhase;
    /**
     * Generate a test plan based on task description and active skills
     */
    private generateTestPlan;
    /**
     * Create test scenarios based on a specific skill's protocol
     */
    private createSkillBasedTestScenarios;
    /**
     * Check if the task is UI-related
     */
    private isUiRelated;
    /**
     * Check if the task is functionality-related
     */
    private isFunctionalityRelated;
    /**
     * Create UI test scenario
     */
    private createUiTestScenario;
    /**
     * Create functional test scenario
     */
    private createFunctionalTestScenario;
    /**
     * Create common test scenarios
     */
    private createCommonTestScenarios;
    /**
     * Create ManualTestPlan object with standard structure
     */
    private createManualTestPlan;
    /**
     * Write test files based on test plan
     */
    private writeTestFiles;
    /**
     * Ensure test directory exists
     */
    private ensureTestDirectory;
    /**
     * Generate a unique test file name
     */
    private generateTestFileName;
    /**
     * Perform implementation based on task requirements and active skills
     */
    private performImplementation;
    /**
     * Get the appropriate implementation strategy based on task description and active skills
     */
    private getImplementationStrategy;
    /**
     * Create HTML/CSS/JS implementation files
     */
    private createHtmlImplementation;
    /**
     * Create generic implementation file
     */
    private createGenericImplementation;
    /**
     * Generate HTML content based on task description
     */
    private generateHtmlContent;
    /**
     * Generate CSS content based on task description
     */
    private generateCssContent;
    /**
     * Generate JavaScript content based on task description
     */
    private generateJsContent;
    /**
     * Generate generic implementation content
     */
    private generateGenericImplContent;
    /**
     * Check if the task is HTML/UI related
     */
    private isHtmlRelated;
    /**
     * Perform refactoring on the codebase considering active skills
     */
    private performRefactoring;
    /**
     * Update task status in the plan.md file
     */
    private updateTaskStatus;
    /**
     * Generate updated plan content with new task status
     */
    private generateUpdatedPlanContent;
    private updatePlanContentById;
    /**
     * Update completed task status with optional commit hash
     */
    private updateCompletedTaskStatus;
    /**
     * Update plan content by finding task with description only
     */
    private updatePlanContentByDescription;
    /**
     * Update completed task status by description with optional commit hash
     */
    private updateCompletedTaskByDescription;
    /**
     * Update phase status in plan.md file
     */
    private updatePhaseStatusInPlan;
    /**
     * Helper function to escape special regex characters
     */
    private escapeRegExp;
    /**
     * Verify phase completion and generate manual test plan
     */
    verifyPhaseCompletion(tasks: Task[], phaseName: string, _trackDir: string, activeSkills?: any[]): Promise<CommandResult>;
    /**
     * Generate verification plan for a phase
     */
    private generatePhaseVerificationPlan;
    private saveVerificationPlan;
    /**
     * Handle user response to manual verification
     */
    handlePhaseVerificationResponse(response: string, phaseName: string, trackDir: string, tasks: Task[], activeSkills: any[]): Promise<CommandResult>;
    /**
     * Handle phase approval - create checkpoint commit and update plan
     */
    private handlePhaseApproval;
    /**
     * Handle phase rejection - process user feedback and fix issues
     */
    private handlePhaseRejection;
    /**
     * Generate content for test file
     */
    private generateTestFileContent;
    /**
     * Get header content for test file
     */
    private getTestFileHeader;
    /**
     * Generate test scenarios block
     */
    private generateTestScenariosBlock;
    /**
     * Generate a single test scenario
     */
    private generateSingleTestScenario;
    /**
     * Get footer content for test file
     */
    private getTestFileFooter;
}
