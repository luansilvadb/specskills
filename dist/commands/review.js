"use strict";
/**
 * Review command - Reviews completed work for quality
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
exports.reviewCommand = void 0;
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
const markdown_1 = require("../utils/markdown");
exports.reviewCommand = {
    name: 'review',
    description: 'Reviews completed work against quality gates and guidelines (Principal Engineer Edition)',
    execute: async (context) => {
        try {
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
            const trackId = context.args[0];
            // Verify setup
            if (!(0, fileSystem_1.fileExists)(conductorDir)) {
                return {
                    success: false,
                    message: 'Conductor is not set up. Please run /setup first.',
                };
            }
            // Load code styleguides
            const styleguidesDir = path.join(conductorDir, 'styleguides');
            const styleguides = (0, fileSystem_1.listFiles)(styleguidesDir, '.md');
            // Load workflow
            const workflowPath = path.join(conductorDir, 'workflow.md');
            const workflowContent = (0, fileSystem_1.fileExists)(workflowPath) ? (0, fileSystem_1.readFile)(workflowPath) : null;
            // Generate review checklist
            const checklist = generateReviewChecklist(styleguides, workflowContent);
            // Get track information if available
            let trackInfo = '';
            const tracksIndexPath = path.join(conductorDir, 'index.md');
            const tracksContent = (0, fileSystem_1.readFile)(tracksIndexPath);
            if (tracksContent) {
                const tracks = (0, markdown_1.parseTracksIndex)(tracksContent);
                const activeTrack = trackId
                    ? tracks.find(t => t.description.includes(trackId) || t.folderPath.includes(trackId))
                    : tracks.find(t => t.status === 'in_progress');
                if (activeTrack) {
                    const trackName = activeTrack.description;
                    trackInfo = `\n## Review Target: ${trackName}\n`;
                    // --- SMART REVIEWER: Volume Check & Iterative Mode ---
                    const isIterativeRequested = context.args.includes('--iterative');
                    try {
                        const shortstat = (0, fileSystem_1.execCommand)('git diff HEAD --shortstat', context.projectRoot);
                        if (shortstat) {
                            const match = shortstat.match(/(\d+)\s+insertions/);
                            const linesGenerated = match ? parseInt(match[1]) : 0;
                            if (linesGenerated > 300 && !isIterativeRequested) {
                                return {
                                    success: true,
                                    message: `[WARNING] **High-Volume implementation detected** (${linesGenerated} lines).\n\nSwitching to **Iterative Review Mode** is highly recommended to ensure Principal-level precision.`,
                                    questions: [
                                        {
                                            header: "Iterative Review",
                                            question: "Should I perform a file-by-file iterative analysis?",
                                            type: "yesno"
                                        }
                                    ],
                                    data: { iterative: true, lines: linesGenerated }
                                };
                            }
                            if (isIterativeRequested) {
                                const changedFiles = (0, fileSystem_1.execCommand)('git diff --name-only HEAD', context.projectRoot)?.split('\n').filter((f) => f.trim()) || [];
                                trackInfo += `\n### [ITERATIVE] Iterative Analysis (${changedFiles.length} files)\n`;
                                for (const file of changedFiles) {
                                    const fileStat = (0, fileSystem_1.execCommand)(`git diff HEAD --shortstat -- ${file}`, context.projectRoot)?.trim();
                                    trackInfo += `- **${file}**: ${fileStat || 'Modified'}\n`;
                                }
                                trackInfo += `\n> [!TIP]\n> Iterating through files prevents context overflow and ensures each module is reviewed against its specific styleguide.\n`;
                            }
                        }
                    }
                    catch (e) { }
                    // --- SMART REVIEWER: Test Inference ---
                    const techStackPath = path.join(conductorDir, 'tech-stack.md');
                    const techStack = (0, fileSystem_1.fileExists)(techStackPath) ? (0, fileSystem_1.readFile)(techStackPath) : '';
                    let testCmd = '';
                    if (techStack?.toLowerCase().includes('typescript') || techStack?.toLowerCase().includes('nodejs')) {
                        testCmd = 'npm test';
                    }
                    else if (techStack?.toLowerCase().includes('go')) {
                        testCmd = 'go test ./...';
                    }
                    else if (techStack?.toLowerCase().includes('python')) {
                        testCmd = 'pytest';
                    }
                    if (testCmd) {
                        return {
                            success: true,
                            message: `[INFO] **Principal Reviewer Active**\n\nI've detected the tech stack and inferred the test command: \`${testCmd}\`.\nShould I run the automated suíte before generating the report?`,
                            questions: [
                                {
                                    header: "Auto-Test",
                                    question: `Run \`${testCmd}\` now?`,
                                    type: "yesno"
                                }
                            ],
                            data: { testCommand: testCmd, track: activeTrack }
                        };
                    }
                }
            }
            // Build review report
            let message = '# Code Review Report: Principal Engineer Edition\n';
            message += trackInfo;
            message += '\n## Summary\nCritical analysis of the implementation against project standards.\n';
            if (context.args.includes('--confirm-test') && context.data?.testCommand) {
                message += `\n[RUNNING] **Running Tests:** \`${context.data.testCommand}\`...\n`;
                try {
                    const testOutput = (0, fileSystem_1.execCommand)(context.data.testCommand, context.projectRoot);
                    message += `\n### Test Results\n\`\`\`\n${testOutput}\n\`\`\`\n`;
                    if (testOutput?.toLowerCase().includes('fail') || testOutput?.toLowerCase().includes('error')) {
                        message += `\n[ERROR] **Tests Failed.** Review the logs above for critical failures.\n`;
                    }
                    else {
                        message += `\n[SUCCESS] **Tests Passed successfully.**\n`;
                    }
                }
                catch (e) {
                    message += `\n[ERROR] **Execution Error:** Suíte de testes falhou ao iniciar.\n`;
                }
            }
            for (const section of checklist) {
                message += `\n## ${section.category}\n\n`;
                for (const item of section.items) {
                    const marker = item.required ? '[ ]' : '( )';
                    message += `${marker} ${item.description}\n`;
                }
            }
            message += '\n## Principal Engineer Notes\n';
            message += 'The review emphasizes maintainability, long-term stability, and architectural alignment.\n';
            return {
                success: true,
                message,
                data: {
                    checklist,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Review failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
};
function generateReviewChecklist(_styleguides, _workflowContent) {
    const checklist = [
        {
            category: 'Strategic Alignment',
            items: [
                { description: 'Feature adheres to the Product Definition', required: true },
                { description: 'Architectural patterns are consistent with Tech Stack', required: true },
            ],
        },
        {
            category: 'Code Quality & Maintainability',
            items: [
                { description: 'Strict compliance with identified style guides', required: true },
                { description: 'Complexity is managed; functions are focused and small', required: true },
                { description: 'Naming is descriptive and professional', required: true },
                { description: 'No redundant or dead code introduced', required: true },
            ],
        },
        {
            category: 'Technical Correctness',
            items: [
                { description: 'Implementation perfectly matches the spec.md', required: true },
                { description: 'All automated tests are passing', required: true },
                { description: 'Coverage requirements (>80%) are satisfied', required: true },
            ],
        },
    ];
    return checklist;
}
