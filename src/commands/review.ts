/**
 * Review command - Performs architectural code review comparing against style guides
 */

import * as path from 'path';
import * as fs from 'fs';
import type { CommandContext, CommandResult, SlashCommand } from '../types';
import {
  fileExists,
  readFile,
  writeFile,
  resolveConductorDir,
} from '../utils/fileSystem';
import { parseTracksIndex } from '../utils/markdown';
import { GitManager } from '../utils/gitUtils';

interface ReviewIssue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'typing' | 'style' | 'architecture' | 'performance' | 'maintainability';
  description: string;
  suggestedFix?: string;
  codeSnippet?: string;
}

interface ReviewReport {
  issues: ReviewIssue[];
  styleGuideCompliance: boolean;
  overallScore: number; // 0-100 scale
  summary: {
    totalFiles: number;
    filesWithIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
}

/**
 * Load style guides for review
 */
function loadStyleGuides(conductorDir: string): Record<string, string> {
  const guides: Record<string, string> = {};
  const guidesDir = path.join(conductorDir, 'styleguides'); // O diretório correto conforme visto na estrutura

  if (fs.existsSync(guidesDir)) {
    const guideFiles = fs.readdirSync(guidesDir).filter(file => file.endsWith('.md'));

    for (const file of guideFiles) {
      const guidePath = path.join(guidesDir, file);
      const guideContent = readFile(guidePath) || '';
      const guideName = file.replace('.md', '');
      guides[guideName] = guideContent;
    }
  }

  return guides;
}

/**
 * Analyze a single file for compliance with style guides
 */
async function analyzeFileForIssues(
  filePath: string,
  styleGuides: Record<string, string>
): Promise<ReviewIssue[]> {
  const issues: ReviewIssue[] = [];
  const content = readFile(filePath) || '';
  const lines = content.split('\n');

  // Determine file type for appropriate analysis
  const ext = path.extname(filePath).substring(1);

  // Basic security checks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for potential security issues
    if (line.toLowerCase().includes('eval(') || line.toLowerCase().includes('new function')) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'critical',
        category: 'security',
        description: 'Potential code injection vulnerability with eval() or Function constructor',
        suggestedFix: 'Use safer alternatives like JSON.parse() for parsing or template literals',
        codeSnippet: line.trim()
      });
    }

    // Check for hardcoded credentials (basic check)
    if (/password|secret|token|key/.test(line) && /=.*["'].*["']/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNum,
        severity: 'high',
        category: 'security',
        description: 'Hardcoded credential detected',
        suggestedFix: 'Move credentials to environment variables or secure configuration',
        codeSnippet: line.trim()
      });
    }
  }

  // Check for typing issues in TypeScript/JavaScript files
  if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Check for explicit any usage
      if (line.includes(': any') || line.includes('as any')) {
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'medium',
          category: 'typing',
          description: 'Usage of "any" type detected, consider adding proper typing',
          suggestedFix: 'Define proper types instead of using "any"',
          codeSnippet: line.trim()
        });
      }

      // Check for missing semicolons if style guide requires them
      if (styleGuides.typescript?.includes('semicolons') && !line.trim().endsWith(';') &&
          line.trim() !== '' && !line.trim().startsWith('//') && !line.trim().startsWith('/*') &&
          !line.trim().endsWith('{') && !line.trim().endsWith('}') && !line.trim().endsWith(')')) {
        issues.push({
          file: filePath,
          line: lineNum,
          severity: 'low',
          category: 'style',
          description: 'Missing semicolon (according to style guide)',
          suggestedFix: 'Add semicolon at the end of the statement',
          codeSnippet: line.trim()
        });
      }
    }
  }

  // Additional language-specific checks can be added here

  return issues;
}

/**
 * Perform comprehensive code review across the project
 */
async function performCodeReview(
  projectPath: string,
  styleGuides: Record<string, string>,
  fileExtensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.go']
): Promise<ReviewReport> {
  const issues: ReviewIssue[] = [];
  let totalFiles = 0;
  let filesWithIssues = 0;

  // Walk through the project directory and analyze each file
  const walkDirectory = (dir: string): string[] => {
    const results: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules, dist, build, .git directories
        if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
          results.push(...walkDirectory(filePath));
        }
      } else if (fileExtensions.some(ext => filePath.endsWith(ext))) {
        results.push(filePath);
      }
    }

    return results;
  };

  const filesToAnalyze = walkDirectory(projectPath);

  for (const filePath of filesToAnalyze) {
    totalFiles++;
    const fileIssues = await analyzeFileForIssues(filePath, styleGuides);

    if (fileIssues.length > 0) {
      filesWithIssues++;
      issues.push(...fileIssues);
    }
  }

  // Calculate summary
  const summary = {
    totalFiles,
    filesWithIssues,
    criticalIssues: issues.filter(i => i.severity === 'critical').length,
    highIssues: issues.filter(i => i.severity === 'high').length,
    mediumIssues: issues.filter(i => i.severity === 'medium').length,
    lowIssues: issues.filter(i => i.severity === 'low').length
  };

  // Calculate overall score (0-100, where 100 is perfect)
  const totalIssues = issues.length;
  const weightedScore = totalFiles > 0
    ? Math.max(0, 100 - (totalIssues * 5)) // Subtract 5 points per issue as a basic scoring
    : 100;

  return {
    issues,
    styleGuideCompliance: totalIssues === 0,
    overallScore: Math.round(weightedScore),
    summary
  };
}

/**
 * Apply automatic fixes to detected issues
 */
async function applyAutoFixes(report: ReviewReport, projectPath: string): Promise<CommandResult> {
  const fixedIssues: ReviewIssue[] = [];
  const failedFixes: ReviewIssue[] = [];

  // Group issues by file for batch processing
  const issuesByFile: Record<string, ReviewIssue[]> = {};

  for (const issue of report.issues) {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  }

  // Process each file with issues
  for (const [filePath, fileIssues] of Object.entries(issuesByFile)) {
    let content = readFile(filePath) || '';
    let contentChanged = false;

    // Sort issues by line number in descending order to avoid line shifting during replacements
    fileIssues.sort((a, b) => b.line - a.line);

    for (const issue of fileIssues) {
      // Apply fixes based on issue category
      if (issue.category === 'style' && issue.suggestedFix) {
        // For style issues, we can make basic replacements
        if (issue.suggestedFix.includes('semicolon')) {
          const lines = content.split('\n');
          if (lines[issue.line - 1] && !lines[issue.line - 1].trim().endsWith(';')) {
            lines[issue.line - 1] = lines[issue.line - 1] + ';';
            content = lines.join('\n');
            contentChanged = true;
            fixedIssues.push(issue);
          }
        }
      }

      // Add more automatic fix implementations based on issue types
    }

    // Write the updated content back to file if changed
    if (contentChanged) {
      try {
        writeFile(filePath, content);
      } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        // Move failed fixes back to failed array
        for (const issue of fileIssues) {
          failedFixes.push(issue);
        }
      }
    }
  }

  // Commit the fixes
  const gitManager = new GitManager(projectPath);
  const commitResult = await gitManager.createAtomicCommit(`fix(review): Apply automatic fixes from code review`);

  return {
    success: failedFixes.length === 0,
    message: `[AUTO FIXES APPLIED] Successfully fixed ${fixedIssues.length} issues. ${failedFixes.length} issues could not be fixed automatically.\n\nCommit created: ${commitResult.message}\n\nPlease review the code and run another review.`
  };
}

/**
 * Generate a user-friendly report of the review results
 */
function generateReviewReportMessage(report: ReviewReport): string {
  if (report.issues.length === 0) {
    return `[REVIEW COMPLETE] **Architecture Review Passed**\n\n✅ No issues found! The code is clean and compliant with style guides.\n\nOverall Score: ${report.overallScore}/100`;
  }

  let message = `[REVIEW RESULTS] **Architecture Review Completed**\n\n`;
  message += `📊 **Summary**:\n`;
  message += `- Total Files Analyzed: ${report.summary.totalFiles}\n`;
  message += `- Files with Issues: ${report.summary.filesWithIssues}\n`;
  message += `- Critical Issues: ${report.summary.criticalIssues}\n`;
  message += `- High Priority: ${report.summary.highIssues}\n`;
  message += `- Medium Priority: ${report.summary.mediumIssues}\n`;
  message += `- Low Priority: ${report.summary.lowIssues}\n\n`;
  message += `📈 **Overall Score**: ${report.overallScore}/100\n\n`;

  // Group issues by severity for better presentation
  const criticalIssues = report.issues.filter(i => i.severity === 'critical');
  const highIssues = report.issues.filter(i => i.severity === 'high');
  const mediumIssues = report.issues.filter(i => i.severity === 'medium');
  const lowIssues = report.issues.filter(i => i.severity === 'low');

  if (criticalIssues.length > 0) {
    message += `🚨 **Critical Issues (${criticalIssues.length}):**\n`;
    for (const issue of criticalIssues) {
      message += `- **${issue.category.toUpperCase()}** in \`${issue.file}:${issue.line}\`: ${issue.description}\n`;
      if (issue.codeSnippet) {
        message += `  *Code*: \`${issue.codeSnippet.substring(0, 50)}...`\n`;
      }
      if (issue.suggestedFix) {
        message += `  *Suggestion*: ${issue.suggestedFix}\n`;
      }
      message += `\n`;
    }
  }

  if (highIssues.length > 0) {
    message += `⚠️ **High Priority Issues (${highIssues.length}):**\n`;
    for (const issue of highIssues) {
      message += `- **${issue.category.toUpperCase()}** in \`${issue.file}:${issue.line}\`: ${issue.description}\n`;
      if (issue.codeSnippet) {
        message += `  *Code*: \`${issue.codeSnippet.substring(0, 50)}...`\n`;
      }
      if (issue.suggestedFix) {
        message += `  *Suggestion*: ${issue.suggestedFix}\n`;
      }
      message += `\n`;
    }
  }

  if (mediumIssues.length > 0) {
    message += `📝 **Medium Priority Issues (${mediumIssues.length}):**\n`;
    for (const issue of mediumIssues) {
      message += `- **${issue.category.toUpperCase()}** in \`${issue.file}:${issue.line}\`: ${issue.description}\n`;
      if (issue.codeSnippet) {
        message += `  *Code*: \`${issue.codeSnippet.substring(0, 50)}...`\n`;
      }
      if (issue.suggestedFix) {
        message += `  *Suggestion*: ${issue.suggestedFix}\n`;
      }
      message += `\n`;
    }
  }

  if (lowIssues.length > 0) {
    message += `ℹ️ **Low Priority Issues (${lowIssues.length}):**\n`;
    for (const issue of lowIssues) {
      message += `- **${issue.category.toUpperCase()}** in \`${issue.file}:${issue.line}\`: ${issue.description}\n`;
      if (issue.codeSnippet) {
        message += `  *Code*: \`${issue.codeSnippet.substring(0, 50)}...`\n`;
      }
      if (issue.suggestedFix) {
        message += `  *Suggestion*: ${issue.suggestedFix}\n`;
      }
      message += `\n`;
    }
  }

  return message;
}

export const reviewCommand: SlashCommand = {
  name: 'review',
  description: 'Performs architectural code review comparing against style guides',
  execute: async (context: CommandContext, args: string[]): Promise<CommandResult> => {
    try {
      const conductorDir = resolveConductorDir(context.projectRoot);

      // Validate project setup
      const requiredFiles = ['product.md', 'tech-stack.md', 'workflow.md'];
      const missingFiles = requiredFiles.filter(f => !fileExists(path.join(conductorDir, f)));

      if (missingFiles.length > 0) {
        return {
          success: false,
          message: '[SKIP] Conductor is not set up. Please run /setup.',
        };
      }

      // Determine target track or review entire project
      let targetDir = conductorDir;

      // If specific track is mentioned, review that track
      if (args.length > 0) {
        const trackDescription = args.join(' ');

        // Read tracks from index
        const tracksContent = readFile(path.join(conductorDir, 'index.md'));
        if (tracksContent) {
          const tracks = parseTracksIndex(tracksContent);

          // Find matching track
          const matchingTracks = tracks.filter((t: any) =>
            t.description.toLowerCase().includes(trackDescription.toLowerCase()) ||
            t.folderPath.toLowerCase().includes(trackDescription.toLowerCase())
          );

          if (matchingTracks.length === 1) {
            targetDir = path.join(conductorDir, matchingTracks[0].folderPath);
          } else if (matchingTracks.length > 1) {
            return {
              success: false,
              message: `[ERROR] Multiple tracks match "${trackDescription}":\n${matchingTracks.map(m => `- ${m.description}`).join('\n')}\n\nPlease be more specific.`
            };
          } else {
            return {
              success: false,
              message: `[ERROR] No track found matching "${trackDescription}".`
            };
          }
        }
      }

      // Load style guides
      const styleGuides = loadStyleGuides(conductorDir);

      // Perform the code review
      const report = await performCodeReview(targetDir, styleGuides);

      // Generate the report message
      const reportMessage = generateReviewReportMessage(report);

      // If no issues found (Caminho Feliz)
      if (report.issues.length === 0) {
        return {
          success: true,
          message: reportMessage
        };
      }

      // If issues found (Caminho Não Feliz)
      return {
        success: false,
        message: reportMessage,
        questions: [
          {
            header: "Fix Options",
            question: "How would you like to address the issues found?",
            type: "choice",
            options: [
              {
                label: "Apply Fixes",
                description: "IA fixes the code automatically and creates a commit"
              },
              {
                label: "Manual Fix",
                description: "Pause for manual fixing"
              },
              {
                label: "Ignore",
                description: "Force completion despite issues"
              }
            ]
          }
        ],
        data: {
          reviewReport: report,
          reviewAction: 'choose_fix_option'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Review failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

/**
 * Handle user response to review results
 */
export async function handleReviewResponse(
  response: string,
  report: ReviewReport,
  projectPath: string
): Promise<CommandResult> {
  if (response.toLowerCase().includes('apply fixes') || response.toLowerCase().includes('automatic')) {
    // Apply automatic fixes
    return await applyAutoFixes(report, projectPath);
  } else if (response.toLowerCase().includes('manual') || response.toLowerCase().includes('pause')) {
    return {
      success: false,
      message: `[MANUAL FIX PAUSED] **Review Paused**\n\nPlease fix the issues manually and then run the review command again.\n\nOnce you've addressed the issues, call /review again to verify the fixes.`
    };
  } else if (response.toLowerCase().includes('ignore') || response.toLowerCase().includes('force')) {
    return {
      success: true,
      message: `[FORCED COMPLETION] **Warning: Issues Not Addressed**\n\nYou have chosen to proceed despite identified issues. This may impact code quality and security.\n\nConsider addressing these issues before production deployment.`
    };
  } else {
    // Default to manual fix if no clear option is identified
    return {
      success: false,
      message: `[UNKNOWN OPTION] **Invalid Option Selected**\n\nPlease choose one of the provided options: Apply Fixes, Manual Fix, or Ignore.`
    };
  }
}
