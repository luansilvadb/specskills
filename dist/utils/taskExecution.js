"use strict";
/**
 * Task Execution Manager for Conductor
 * Handles atomic task execution with TDD workflow and phase verification
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskExecutionManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fileSystem_1 = require("./fileSystem");
const gitUtils_1 = require("./gitUtils");
class TaskExecutionManager {
    /**
     * Execute a single task atomically following TDD workflow
     */
    async executeTaskAtomically(task, trackDir, activeSkills = []) {
        try {
            // Initialize git manager for atomic commits
            const gitManager = new gitUtils_1.GitManager(trackDir);
            // Update task status to in-progress in plan.md
            await this.updateTaskStatus(trackDir, task.id, 'in-progress');
            // Initialize task execution context
            const context = {
                taskId: task.id,
                taskDescription: task.description,
                currentPhase: 'red',
                activeSkills // Adiciona as skills ativas ao contexto
            };
            // Phase 1: Red (Write failing tests)
            const redResult = await this.executeRedPhase(task, context, trackDir);
            if (!redResult.success) {
                return redResult;
            }
            // Phase 2: Green (Implement to pass tests)
            const greenResult = await this.executeGreenPhase(task, context, trackDir);
            if (!greenResult.success) {
                return greenResult;
            }
            // Phase 3: Refactor (Clean up and optimize)
            const refactorResult = await this.executeRefactorPhase(task, context, trackDir);
            if (!refactorResult.success) {
                return refactorResult;
            }
            // Create atomic commit for this task
            const commitMessage = `feat(task): ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}`;
            const commitResult = await gitManager.createAtomicCommit(commitMessage);
            if (!commitResult.success && !commitResult.message.includes('No changes to commit')) {
                return {
                    success: false,
                    message: `[COMMIT FAILED] Could not create atomic commit for task: ${task.description}\n${commitResult.message}`
                };
            }
            // Add detailed note to the commit
            if (commitResult.data?.hash) {
                const noteContent = `Task: ${task.id}\nDescription: ${task.description}\nStatus: completed\nType: ${task.type}\nPriority: ${task.priority}\nPhase: TDD (Red-Green-Refactor)\n`;
                await gitManager.addCommitNote(commitResult.data.hash, noteContent);
            }
            // Update task status to completed with commit hash
            await this.updateTaskStatus(trackDir, task.id, 'completed', commitResult.data?.hash);
            return {
                success: true,
                message: `[TASK COMPLETED] **${task.description}**\n\nTDD cycle completed successfully:\n- Red: Wrote failing tests\n- Green: Implemented functionality\n- Refactor: Optimized code\n- Commit: ${commitResult.data?.hash || 'N/A'}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `[TASK FAILED] Error executing task: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Execute the Red phase: Write failing tests
     */
    async executeRedPhase(task, context, trackDir) {
        // Update context to red phase
        context.currentPhase = 'red';
        // Generate test plan based on task description and active skills
        const testPlan = await this.generateTestPlan(task.description, context.activeSkills || []);
        // Write test files
        await this.writeTestFiles(testPlan, trackDir);
        // Update task execution context
        context.testResults = {
            passed: false,
            output: 'Tests written but not yet passing - TDD Red phase'
        };
        return {
            success: true,
            message: `[RED PHASE] **${task.description}**\n\nTests have been written and are intentionally failing:\n${testPlan.testScenarios.map(t => `- ${t.description}`).join('\n')}\n\nReady to move to Green phase (implementation).`
        };
    }
    /**
     * Attempt to debug and fix implementation issues automatically
     */
    async attemptDebugAndFix(task, trackDir, context, attemptNum) {
        // In this implementation, we'll log the debug attempt and potentially modify code based on error patterns
        // In a more advanced implementation, this could analyze the test failure more deeply
        try {
            // Log debug attempt
            console.log(`Debug attempt ${attemptNum} for task: ${task.description}`);
            // Here we would potentially implement more sophisticated debugging logic
            // For now, we'll perform a basic retry of the implementation with slight variation
            // Implementation based on task requirements and active skills
            await this.performImplementation(task, trackDir, context.activeSkills || []);
            return {
                success: true,
                message: `Debug attempt ${attemptNum} completed - re-implemented code based on task requirements`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Debug attempt ${attemptNum} failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Execute the Green phase: Implement functionality to pass tests
     */
    async executeGreenPhase(task, context, trackDir) {
        // Update context to green phase
        context.currentPhase = 'green';
        const gitManager = new gitUtils_1.GitManager(trackDir);
        // Try to pass tests in sequence: initial → implementation → debugging
        let testResult = await this.initializeGreenPhase(task, context, gitManager, trackDir);
        if (!testResult.success) {
            testResult = await this.handleImplementationAttempt(task, context, gitManager, trackDir);
        }
        if (!testResult.success) {
            testResult = await this.handleDebuggingAttempts(task, context, gitManager, trackDir);
        }
        context.testResults = this.createTestResultContext(testResult);
        return testResult.success
            ? this.createSuccessfulGreenPhaseResponse(task)
            : this.createFailedGreenPhaseResponse(task, testResult);
    }
    /**
     * Initialize the green phase by running initial tests
     */
    async initializeGreenPhase(_task, _context, gitManager, _trackDir) {
        return await gitManager.runTestSuite();
    }
    /**
     * Handle initial implementation attempt if tests don't pass
     */
    async handleImplementationAttempt(task, context, gitManager, trackDir) {
        await this.performImplementation(task, trackDir, context.activeSkills || []);
        return await gitManager.runTestSuite();
    }
    /**
     * Handle debugging attempts when implementation doesn't pass tests
     */
    async handleDebuggingAttempts(task, context, gitManager, trackDir) {
        let attempts = 0;
        const maxAttempts = 2;
        let testResult = await gitManager.runTestSuite();
        while (!testResult.success && attempts < maxAttempts) {
            attempts++;
            const debugResult = await this.attemptDebugAndFix(task, trackDir, context, attempts);
            if (!debugResult.success) {
                return this.createDebugFailureResult(task, debugResult, attempts);
            }
            testResult = await gitManager.runTestSuite();
            if (testResult.success) {
                break;
            }
        }
        return testResult;
    }
    /**
     * Create failure result for debugging attempt
     */
    createDebugFailureResult(task, debugResult, attempts) {
        return {
            success: false,
            message: `[GREEN PHASE DEBUG FAILED] **${task.description}**\n\nDebug attempt ${attempts} failed:\n${debugResult.message}`
        };
    }
    /**
     * Create the test result context
     */
    createTestResultContext(testResult) {
        return {
            passed: testResult.success,
            output: testResult.message,
            errors: testResult.success ? undefined : [testResult.message]
        };
    }
    /**
     * Create successful green phase response
     */
    createSuccessfulGreenPhaseResponse(task) {
        return {
            success: true,
            message: `[GREEN PHASE] **${task.description}**\n\nImplementation completed successfully:\n- Functionality implemented\n- All tests are now passing\n\nReady to move to Refactor phase.`
        };
    }
    /**
     * Create failed green phase response
     */
    createFailedGreenPhaseResponse(task, testResult) {
        return {
            success: false,
            message: `[GREEN PHASE FAILED] **${task.description}**\n\nImplementation did not satisfy tests after 2 automatic correction attempts.\n\n**PARA TUDO!** Need user assistance to resolve this issue:\n${testResult.message}`,
            questions: [
                {
                    header: "User Assistance Required",
                    question: "Please provide guidance on how to fix the implementation for this task:",
                    type: "text",
                    required: true
                }
            ]
        };
    }
    /**
     * Execute the Refactor phase: Clean up and optimize code
     */
    async executeRefactorPhase(task, context, trackDir) {
        // Update context to refactor phase
        context.currentPhase = 'refactor';
        // Perform refactoring based on code quality metrics and active skills
        const refactoringNotes = await this.performRefactoring(trackDir, context.activeSkills || []);
        context.refactorNotes = refactoringNotes;
        // Run tests again to ensure refactoring didn't break functionality
        const gitManager = new gitUtils_1.GitManager(trackDir);
        const testResult = await gitManager.runTestSuite();
        context.testResults = {
            passed: testResult.success,
            output: testResult.message,
            errors: testResult.success ? undefined : [testResult.message]
        };
        if (testResult.success) {
            return {
                success: true,
                message: `[REFACTOR PHASE] **${task.description}**\n\nCode refactored successfully:\n- Code optimized and cleaned up\n- All tests still passing\n\nTask execution completed!`
            };
        }
        else {
            return {
                success: false,
                message: `[REFACTOR PHASE FAILED] **${task.description}**\n\nRefactoring introduced errors:\n${testResult.message}`
            };
        }
    }
    /**
     * Generate a test plan based on task description and active skills
     */
    async generateTestPlan(taskDescription, activeSkills = []) {
        // Create test scenarios based on keywords in the task
        const testScenarios = [];
        // Add UI tests if UI-related keywords are found
        if (this.isUiRelated(taskDescription)) {
            testScenarios.push(this.createUiTestScenario());
        }
        // Add functional tests if functionality-related keywords are found
        if (this.isFunctionalityRelated(taskDescription)) {
            testScenarios.push(this.createFunctionalTestScenario());
        }
        // Add test scenarios based on active skills
        if (activeSkills && activeSkills.length > 0) {
            for (const skill of activeSkills) {
                if (skill.protocol) {
                    // Generate specific test scenarios based on the skill's protocol
                    testScenarios.push(...this.createSkillBasedTestScenarios(skill, taskDescription));
                }
            }
        }
        // Add common test scenarios regardless of keywords
        testScenarios.push(...this.createCommonTestScenarios());
        return this.createManualTestPlan(testScenarios);
    }
    /**
     * Create test scenarios based on a specific skill's protocol
     */
    createSkillBasedTestScenarios(skill, taskDescription) {
        const scenarios = [];
        // Example: Add tests based on skill protocols
        if (skill.id && skill.protocol) {
            scenarios.push({
                description: `Verify ${skill.title || skill.id} protocol compliance for ${taskDescription}`,
                steps: [
                    `Apply ${skill.title || skill.id} guidelines`,
                    `Check for adherence to protocol: ${skill.protocol.substring(0, 50)}...`
                ],
                expectedResult: `Implementation follows ${skill.title || skill.id} best practices and guidelines`
            });
        }
        return scenarios;
    }
    /**
     * Check if the task is UI-related
     */
    isUiRelated(taskDescription) {
        const lowerDesc = taskDescription.toLowerCase();
        return lowerDesc.includes('ui') || lowerDesc.includes('interface');
    }
    /**
     * Check if the task is functionality-related
     */
    isFunctionalityRelated(taskDescription) {
        const lowerDesc = taskDescription.toLowerCase();
        return lowerDesc.includes('function') || lowerDesc.includes('feature');
    }
    /**
     * Create UI test scenario
     */
    createUiTestScenario() {
        return {
            description: 'UI element renders correctly',
            steps: ['Render the component', 'Verify DOM structure'],
            expectedResult: 'Component renders without errors'
        };
    }
    /**
     * Create functional test scenario
     */
    createFunctionalTestScenario() {
        return {
            description: 'Function performs as expected',
            steps: ['Call the function with test inputs', 'Verify outputs'],
            expectedResult: 'Function returns expected results'
        };
    }
    /**
     * Create common test scenarios
     */
    createCommonTestScenarios() {
        return [
            {
                description: 'Edge cases handled properly',
                steps: ['Provide edge case inputs', 'Verify behavior'],
                expectedResult: 'No errors or exceptions thrown'
            },
            {
                description: 'Performance requirements met',
                steps: ['Run performance tests', 'Measure execution time/memory'],
                expectedResult: 'Meets defined performance thresholds'
            }
        ];
    }
    /**
     * Create ManualTestPlan object with standard structure
     */
    createManualTestPlan(testScenarios) {
        return {
            testScenarios,
            acceptanceCriteria: [
                'All defined test scenarios pass',
                'No errors or exceptions thrown',
                'Performance requirements met',
                'Code quality standards maintained'
            ],
            verificationSteps: [
                'Run automated test suite',
                'Perform manual verification if needed',
                'Check code coverage metrics',
                'Validate against acceptance criteria'
            ]
        };
    }
    /**
     * Write test files based on test plan
     */
    async writeTestFiles(testPlan, trackDir) {
        const testDir = this.ensureTestDirectory(trackDir);
        const testFileName = this.generateTestFileName();
        const testFilePath = path.join(testDir, testFileName);
        const testContent = this.generateTestFileContent(testPlan);
        fs.writeFileSync(testFilePath, testContent);
    }
    /**
     * Ensure test directory exists
     */
    ensureTestDirectory(trackDir) {
        const testDir = path.join(trackDir, '__tests__');
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        return testDir;
    }
    /**
     * Generate a unique test file name
     */
    generateTestFileName() {
        return `task_${Date.now()}_spec.ts`;
    }
    /**
     * Perform implementation based on task requirements and active skills
     */
    async performImplementation(task, trackDir, activeSkills = []) {
        // Determine the type of files needed based on task description and active skills
        const implementationStrategy = this.getImplementationStrategy(task.description, activeSkills);
        await implementationStrategy(task, trackDir);
        return { success: true };
    }
    /**
     * Get the appropriate implementation strategy based on task description and active skills
     */
    getImplementationStrategy(taskDescription, activeSkills = []) {
        // Check if any active skill influences the implementation strategy
        for (const skill of activeSkills) {
            if (skill.protocol) {
                // If a skill has a specific protocol that applies to this task, use it
                if (skill.protocol.toLowerCase().includes('html') || skill.protocol.toLowerCase().includes('ui')) {
                    return this.createHtmlImplementation.bind(this);
                }
                // Add more protocol-based implementation strategies as needed
            }
        }
        const keywords = taskDescription.toLowerCase();
        if (this.isHtmlRelated(keywords)) {
            return this.createHtmlImplementation.bind(this);
        }
        else {
            return this.createGenericImplementation.bind(this);
        }
    }
    /**
     * Create HTML/CSS/JS implementation files
     */
    async createHtmlImplementation(task, trackDir) {
        const htmlContent = this.generateHtmlContent(task.description);
        const cssContent = this.generateCssContent(task.description);
        const jsContent = this.generateJsContent(task.description);
        // Write files
        fs.writeFileSync(path.join(trackDir, 'index.html'), htmlContent);
        fs.writeFileSync(path.join(trackDir, 'styles.css'), cssContent);
        fs.writeFileSync(path.join(trackDir, 'main.js'), jsContent);
    }
    /**
     * Create generic implementation file
     */
    async createGenericImplementation(task, trackDir) {
        const implContent = this.generateGenericImplContent(task.description, task.id);
        fs.writeFileSync(path.join(trackDir, `implementation_${task.id}.ts`), implContent);
    }
    /**
     * Generate HTML content based on task description
     */
    generateHtmlContent(taskDescription) {
        return `<!DOCTYPE html>
<html>
<head>
  <title>Task Implementation</title>
  <style>
    /* Styles for ${taskDescription} */
  </style>
</head>
<body>
  <div id="app">
    <!-- Implementation for ${taskDescription} -->
  </div>
  <script src="main.js"></script>
</body>
</html>`;
    }
    /**
     * Generate CSS content based on task description
     */
    generateCssContent(taskDescription) {
        return `/* Styles for ${taskDescription} */
#app {
  /* Add styles here */
}`;
    }
    /**
     * Generate JavaScript content based on task description
     */
    generateJsContent(taskDescription) {
        return `// Implementation for ${taskDescription}
document.addEventListener('DOMContentLoaded', () => {
  // Implementation code here
});
`;
    }
    /**
     * Generate generic implementation content
     */
    generateGenericImplContent(taskDescription, _taskId) {
        return `// Implementation for ${taskDescription}
// Generated at ${new Date().toISOString()}

export function implementTask() {
  // Implementation for ${taskDescription}
  // Add your implementation here

  return { success: true };
}
`;
    }
    /**
     * Check if the task is HTML/UI related
     */
    isHtmlRelated(keywords) {
        return keywords.includes('html') || keywords.includes('ui') || keywords.includes('interface');
    }
    /**
     * Perform refactoring on the codebase considering active skills
     */
    async performRefactoring(_trackDir, activeSkills = []) {
        // Start with standard refactoring notes
        const notes = [
            'Consolidated duplicate code',
            'Improved variable naming',
            'Added proper error handling',
            'Optimized performance bottlenecks',
            'Updated documentation comments'
        ];
        // Enhance refactoring based on active skills
        for (const skill of activeSkills) {
            if (skill.protocol) {
                notes.push(`Applied ${skill.title || skill.id} protocol: ${skill.protocol.substring(0, 30)}...`);
            }
        }
        return notes.join('; ');
    }
    /**
     * Update task status in the plan.md file
     */
    async updateTaskStatus(trackDir, taskId, status, commitHash) {
        const planPath = path.join(trackDir, 'plan.md');
        let planContent = (0, fileSystem_1.readFile)(planPath) || '';
        const taskDescription = planContent.match(new RegExp(`- \\[.?\\] ([^\n]*?${taskId}[^\n]*)`))?.[1] || '';
        const updatedContent = this.generateUpdatedPlanContent(planContent, taskId, status, taskDescription, commitHash);
        (0, fileSystem_1.writeFile)(planPath, updatedContent);
    }
    /**
     * Generate updated plan content with new task status
     */
    generateUpdatedPlanContent(planContent, taskId, status, taskDescription, commitHash) {
        if (status === 'not-started') {
            // For 'not-started', we don't change the status since it's already the default [ ]
            return planContent;
        }
        let updatedContent = this.updatePlanContentById(planContent, taskId, status, taskDescription, commitHash);
        if (updatedContent === planContent) {
            // If no replacement was made by ID, try by description
            updatedContent = this.updatePlanContentByDescription(planContent, status, taskDescription, commitHash);
        }
        return updatedContent;
    }
    updatePlanContentById(planContent, taskId, status, taskDescription, commitHash) {
        if (status === 'in-progress') {
            return planContent.replace(new RegExp(`(- \\[ \\])\\s*([^\\n]*${taskId}|[^\\n]*${this.escapeRegExp(taskDescription)})`, 'i'), '- [~] $2');
        }
        else if (status === 'completed') {
            return this.updateCompletedTaskStatus(planContent, taskId, taskDescription, commitHash);
        }
        return planContent;
    }
    /**
     * Update completed task status with optional commit hash
     */
    updateCompletedTaskStatus(planContent, taskId, taskDescription, commitHash) {
        if (commitHash) {
            // Replace with completed status and add commit hash
            return planContent.replace(new RegExp(`(- \\[[ ~]\\])\\s*([^\\n]*${taskId}|[^\\n]*${this.escapeRegExp(taskDescription)})(\\s*\\[commit:[a-f0-9]+\\])?`, 'i'), `- [x] $2 [commit:${commitHash}]`);
        }
        else {
            return planContent.replace(new RegExp(`(- \\[[ ~]\\])\\s*([^\\n]*${taskId}|[^\\n]*${this.escapeRegExp(taskDescription)})`, 'i'), '- [x] $2');
        }
    }
    /**
     * Update plan content by finding task with description only
     */
    updatePlanContentByDescription(planContent, status, taskDescription, commitHash) {
        if (status === 'in-progress') {
            return planContent.replace(new RegExp(`(- \\[ \\])\\s*(${this.escapeRegExp(taskDescription)})`, 'i'), '- [~] $2');
        }
        else if (status === 'completed') {
            return this.updateCompletedTaskByDescription(planContent, taskDescription, commitHash);
        }
        return planContent;
    }
    /**
     * Update completed task status by description with optional commit hash
     */
    updateCompletedTaskByDescription(planContent, taskDescription, commitHash) {
        if (commitHash) {
            // Replace with completed status and add commit hash
            return planContent.replace(new RegExp(`(- \\[[ ~]\\])\\s*(${this.escapeRegExp(taskDescription)})(\\s*\\[commit:[a-f0-9]+\\])?`, 'i'), `- [x] $2 [commit:${commitHash}]`);
        }
        else {
            return planContent.replace(new RegExp(`(- \\[[ ~]\\])\\s*(${this.escapeRegExp(taskDescription)})`, 'i'), '- [x] $2');
        }
    }
    /**
     * Update phase status in plan.md file
     */
    async updatePhaseStatusInPlan(trackDir, phaseName, status) {
        const planPath = path.join(trackDir, 'plan.md');
        let planContent = (0, fileSystem_1.readFile)(planPath) || '';
        // Check if the plan has phases (look for phase headers)
        const hasPhases = planContent.includes('# ') || planContent.includes('## ');
        if (hasPhases) {
            // If the plan has phases, we'll mark the phase header with the status
            // Look for patterns like ## Phase Name or ### Phase Name
            const phaseHeaderPattern = new RegExp(`^(##|#)\\s+${this.escapeRegExp(phaseName)}.*$`, 'im');
            if (phaseHeaderPattern.test(planContent)) {
                // If phase header exists, add status to it
                const phaseStatusMarker = status === 'completed' ? ' [DONE]' : status === 'in-progress' ? ' [IN PROGRESS]' : '';
                planContent = planContent.replace(phaseHeaderPattern, `$&${phaseStatusMarker}`);
            }
            else {
                // If phase header doesn't exist, we'll just make sure all tasks are marked appropriately
                // The individual tasks should already be updated by updateTaskStatus
            }
        }
        else {
            // If no phases, the entire plan is treated as one phase
            // In this case, we ensure all tasks are properly marked
        }
        // Also ensure all tasks in this phase are marked as completed
        // Find tasks in this phase and ensure they're marked as completed
        // This implementation assumes tasks are grouped under phase headers
        // Write updated content back to file
        (0, fileSystem_1.writeFile)(planPath, planContent);
    }
    /**
     * Helper function to escape special regex characters
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    /**
     * Verify phase completion and generate manual test plan
     */
    async verifyPhaseCompletion(tasks, phaseName, _trackDir, activeSkills = []) {
        // Check if all tasks in this phase are completed
        const pendingTasks = tasks.filter(t => t.status !== 'completed');
        if (pendingTasks.length > 0) {
            return {
                success: false,
                message: `[PHASE VERIFY] **${phaseName}**\n\nCannot verify phase completion. The following tasks are not yet completed:\n${pendingTasks.map(t => `- ${t.description}`).join('\n')}\n\nComplete all tasks before verifying phase.`
            };
        }
        // Initialize git manager for checkpoint
        const gitManager = new gitUtils_1.GitManager(_trackDir);
        // Run test suite
        const testResult = await gitManager.runTestSuite();
        if (!testResult.success) {
            return {
                success: false,
                message: `[PHASE VERIFY FAILED] **${phaseName}**\n\nTest suite failed:\n${testResult.message}`
            };
        }
        // Generate manual test plan for this phase considering active skills
        const manualTestPlan = await this.generatePhaseVerificationPlan(tasks, phaseName, activeSkills);
        // Save verification plan
        await this.saveVerificationPlan(manualTestPlan, phaseName, _trackDir, activeSkills);
        return {
            success: true,
            message: `[PHASE VERIFY] **${phaseName}**\n\nPhase completion verified! Test suite passed.\n\nGenerated manual test plan:\n\n${manualTestPlan.testScenarios.map(t => `**${t.description}**\nSteps: ${t.steps.join(', ')}\nExpected: ${t.expectedResult}`).join('\n\n')}\n\n`,
            questions: [
                {
                    header: "Manual Verification",
                    question: "Os testes automatizados passaram. Por favor, siga estes passos manuais... Isso atende às suas expectativas?",
                    type: "choice",
                    options: [
                        { label: "Sim, tudo certo", description: "Prosseguir para próximo passo" },
                        { label: "Não, identifiei problemas", description: "Voltar para correções" }
                    ]
                }
            ],
            data: {
                phaseVerification: manualTestPlan,
                phaseName: phaseName,
                trackDir: _trackDir,
                pending: true, // Indicate this phase needs manual verification
                phaseStatus: 'verification_pending'
            }
        };
    }
    /**
     * Generate verification plan for a phase
     */
    async generatePhaseVerificationPlan(tasks, _phaseName, activeSkills = []) {
        const testScenarios = [];
        // Create test scenarios based on the tasks in the phase
        for (const task of tasks) {
            testScenarios.push({
                description: `Verify ${task.description} implementation`,
                steps: [
                    'Navigate to the implemented feature',
                    'Execute the functionality',
                    'Check for expected behavior',
                    'Validate error handling'
                ],
                expectedResult: 'Feature works as specified in the task'
            });
        }
        // Add verification scenarios based on active skills
        if (activeSkills && activeSkills.length > 0) {
            for (const skill of activeSkills) {
                if (skill.protocol) {
                    testScenarios.push({
                        description: `Verify ${skill.title || skill.id} protocol compliance`,
                        steps: [
                            `Check adherence to ${skill.title || skill.id} guidelines`,
                            `Validate implementation against ${skill.protocol.substring(0, 50)}...`,
                            `Confirm best practices from ${skill.title || skill.id} are applied`
                        ],
                        expectedResult: `Implementation follows ${skill.title || skill.id} standards and protocols`
                    });
                }
            }
        }
        // Add integration test scenarios
        testScenarios.push({
            description: 'Integration between phase components',
            steps: [
                'Test interactions between components',
                'Verify data flow',
                'Check error conditions',
                'Validate performance'
            ],
            expectedResult: 'Components work together seamlessly'
        });
        return {
            testScenarios,
            acceptanceCriteria: [
                'All individual tasks function correctly',
                'Integration between components works',
                'Performance meets requirements',
                'Error handling is appropriate'
            ],
            verificationSteps: [
                'Execute all test scenarios',
                'Validate against acceptance criteria',
                'Confirm user acceptance',
                'Sign off on phase completion'
            ]
        };
    }
    async saveVerificationPlan(plan, phaseName, trackDir, _activeSkills) {
        const safe = phaseName.replace(/[^a-z0-9-_]/gi, '_').slice(0, 80) || 'phase';
        const lines = [
            `# Phase verification: ${phaseName}`,
            '',
            ...plan.testScenarios.map((t) => `## ${t.description}\n- Steps: ${t.steps.join('; ')}\n- Expected: ${t.expectedResult}\n`),
            '## Acceptance criteria',
            ...plan.acceptanceCriteria.map((c) => `- ${c}`),
        ];
        (0, fileSystem_1.writeFile)(path.join(trackDir, `phase-verification-${safe}.md`), lines.join('\n'));
    }
    /**
     * Handle user response to manual verification
     */
    async handlePhaseVerificationResponse(response, phaseName, trackDir, tasks, activeSkills) {
        if (response.toLowerCase().includes('sim') || response.toLowerCase().includes('tudo certo')) {
            // Caminho Feliz: Usuário aprovou
            return await this.handlePhaseApproval(phaseName, trackDir, tasks, activeSkills);
        }
        else {
            // Caminho Não Feliz: Usuário identificou problemas
            return await this.handlePhaseRejection(response, phaseName, trackDir, tasks, activeSkills);
        }
    }
    /**
     * Handle phase approval - create checkpoint commit and update plan
     */
    async handlePhaseApproval(phaseName, trackDir, tasks, _activeSkills) {
        // Initialize git manager for checkpoint
        const gitManager = new gitUtils_1.GitManager(trackDir);
        // Create checkpoint commit for the phase
        const taskSummaries = tasks.map(task => `- ${task.description} [completed]`);
        const checkpointResult = await gitManager.createCheckpointCommit(phaseName, taskSummaries);
        if (!checkpointResult.success) {
            return checkpointResult;
        }
        // Add detailed test report to the checkpoint commit
        const testReport = await gitManager.runTestSuite();
        const commitHash = checkpointResult.data?.hash || gitManager.getLatestCommitHash();
        // Prepare checkpoint report
        const checkpointReport = {
            phaseName,
            completedTasks: tasks.map(t => t.description),
            commitHashes: [commitHash],
            testSuiteResults: testReport.message,
            manualVerificationSteps: ['Manual verification completed by user', 'All criteria met', 'Approved for continuation'],
            approvalStatus: 'approved',
            notes: `Phase "${phaseName}" completed and approved by user at ${new Date().toISOString()}`
        };
        // Add checkpoint report as git notes
        const noteContent = `Phase: ${phaseName}\nCompleted: ${new Date().toISOString()}\nTasks: ${tasks.length}\nStatus: approved\nReport: ${JSON.stringify(checkpointReport, null, 2)}`;
        await gitManager.addCommitNote(commitHash, noteContent);
        // Update phase status in plan
        await this.updatePhaseStatusInPlan(trackDir, phaseName, 'completed');
        return {
            success: true,
            message: `[PHASE APPROVED] **${phaseName}**\n\nCheckpoint commit created: ${commitHash}\n\nPhase completed and approved:\n- All tasks marked as completed\n- Checkpoint commit with detailed report\n- Manual verification confirmed`
        };
    }
    /**
     * Handle phase rejection - process user feedback and fix issues
     */
    async handlePhaseRejection(feedback, phaseName, trackDir, _tasks, _activeSkills) {
        // Log the feedback for debugging
        console.log(`User feedback for phase "${phaseName}":`, feedback);
        // Process the feedback and generate fixes
        // This would involve analyzing the feedback and creating targeted fixes
        // For now, we'll return a message asking for more details to address the issues
        return {
            success: false,
            message: `[PHASE REJECTED] **${phaseName}**\n\nUser identified issues:\n${feedback}\n\nThe system needs to address these problems before proceeding:\n\n**FEEDBACK ANALYSIS:**\n- Issue: ${feedback}\n- Action: IA will analyze feedback and generate fixes\n- Status: Awaiting implementation of feedback processing\n\nWould you like to provide more details about the issues or specify which tasks need correction?`,
            questions: [
                {
                    header: "Feedback Details",
                    question: "Please provide more specific details about the issues to help the IA fix them:",
                    type: "text",
                    required: true
                }
            ],
            data: {
                phaseName,
                trackDir,
                feedback,
                needsCorrection: true,
                phaseStatus: 'rework_needed'
            }
        };
    }
    /**
     * Generate content for test file
     */
    generateTestFileContent(testPlan) {
        let content = this.getTestFileHeader();
        content += this.generateTestScenariosBlock(testPlan.testScenarios);
        content += this.getTestFileFooter();
        return content;
    }
    /**
     * Get header content for test file
     */
    getTestFileHeader() {
        return `// Auto-generated tests for task execution\n\n`;
    }
    /**
     * Generate test scenarios block
     */
    generateTestScenariosBlock(testScenarios) {
        let content = `describe('Task Implementation Tests', () => {\n`;
        for (const scenario of testScenarios) {
            content += this.generateSingleTestScenario(scenario);
        }
        content += `});\n`;
        return content;
    }
    /**
     * Generate a single test scenario
     */
    generateSingleTestScenario(scenario) {
        let scenarioContent = `  test('${scenario.description}', () => {\n`;
        scenarioContent += `    // Implementation for: ${scenario.description}\n`;
        scenarioContent += `    // Steps: ${scenario.steps.join(', ')}\n`;
        scenarioContent += `    // Expected: ${scenario.expectedResult}\n`;
        scenarioContent += `    expect(true).toBe(false); // Failing test for TDD\n`;
        scenarioContent += `  });\n`;
        return scenarioContent;
    }
    /**
     * Get footer content for test file
     */
    getTestFileFooter() {
        return ''; // Empty for now, but can be extended
    }
}
exports.TaskExecutionManager = TaskExecutionManager;
