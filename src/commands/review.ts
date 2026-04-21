/**
 * Review command - Reviews completed work for quality
 */

import * as path from 'path';
import type { CommandContext, CommandResult, SlashCommand } from '../types';
import {
  fileExists,
  readFile,
  resolveConductorDir,
  listFiles,
  execCommand,
} from '../utils/fileSystem';
import { parseTracksIndex } from '../utils/markdown';


interface ReviewChecklist {
  category: string;
  items: ReviewItem[];
}

interface ReviewItem {
  description: string;
  required: boolean;
}

export const reviewCommand: SlashCommand = {
  name: 'review',
  description: 'Reviews completed work against quality gates and guidelines (Principal Engineer Edition)',
  execute: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const conductorDir = resolveConductorDir(context.projectRoot);
      const trackId = context.args[0];

      // Verify setup
      if (!fileExists(conductorDir)) {
        return {
          success: false,
          message: 'Conductor is not set up. Please run /setup first.',
        };
      }

      // Load code styleguides
      const styleguidesDir = path.join(conductorDir, 'styleguides');
      const styleguides = listFiles(styleguidesDir, '.md');

      // Load workflow
      const workflowPath = path.join(conductorDir, 'workflow.md');
      const workflowContent = fileExists(workflowPath) ? readFile(workflowPath) : null;

      // Generate review checklist
      const checklist = generateReviewChecklist(styleguides, workflowContent);

      // Get track information if available
      let trackInfo = '';
      const tracksIndexPath = path.join(conductorDir, 'index.md');
      const tracksContent = readFile(tracksIndexPath);
      
      if (tracksContent) {
        const tracks = parseTracksIndex(tracksContent);
        const activeTrack = trackId 
          ? tracks.find(t => t.description.includes(trackId) || t.folderPath.includes(trackId))
          : tracks.find(t => t.status === 'in_progress');

        if (activeTrack) {
          const trackName = activeTrack.description;
          trackInfo = `\n## Review Target: ${trackName}\n`;
          
          // --- SMART REVIEWER: Volume Check & Iterative Mode ---
          const isIterativeRequested = context.args.includes('--iterative');
          
          try {
            const shortstat = execCommand('git diff HEAD --shortstat', context.projectRoot);
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
                const changedFiles = execCommand('git diff --name-only HEAD', context.projectRoot)?.split('\n').filter((f: string) => f.trim()) || [];
                trackInfo += `\n### [ITERATIVE] Iterative Analysis (${changedFiles.length} files)\n`;
                for (const file of changedFiles) {
                  const fileStat = execCommand(`git diff HEAD --shortstat -- ${file}`, context.projectRoot)?.trim();
                  trackInfo += `- **${file}**: ${fileStat || 'Modified'}\n`;
                }
                trackInfo += `\n> [!TIP]\n> Iterating through files prevents context overflow and ensures each module is reviewed against its specific styleguide.\n`;
              }
            }
          } catch (e) {}

          // --- SMART REVIEWER: Test Inference ---
          const techStackPath = path.join(conductorDir, 'tech-stack.md');
          const techStack = fileExists(techStackPath) ? readFile(techStackPath) : '';
          let testCmd = '';
          if (techStack?.toLowerCase().includes('typescript') || techStack?.toLowerCase().includes('nodejs')) {
            testCmd = 'npm test';
          } else if (techStack?.toLowerCase().includes('go')) {
            testCmd = 'go test ./...';
          } else if (techStack?.toLowerCase().includes('python')) {
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
          const testOutput = execCommand(context.data.testCommand, context.projectRoot);
          message += `\n### Test Results\n\`\`\`\n${testOutput}\n\`\`\`\n`;
          if (testOutput?.toLowerCase().includes('fail') || testOutput?.toLowerCase().includes('error')) {
            message += `\n[ERROR] **Tests Failed.** Review the logs above for critical failures.\n`;
          } else {
            message += `\n[SUCCESS] **Tests Passed successfully.**\n`;
          }
        } catch (e) {
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
    } catch (error) {
      return {
        success: false,
        message: `Review failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

function generateReviewChecklist(
  _styleguides: string[],
  _workflowContent: string | null
): ReviewChecklist[] {
  const checklist: ReviewChecklist[] = [
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
