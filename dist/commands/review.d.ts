/**
 * Review command - Performs architectural code review comparing against style guides
 */
import type { CommandResult, SlashCommand } from '../types';
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
    overallScore: number;
    summary: {
        totalFiles: number;
        filesWithIssues: number;
        criticalIssues: number;
        highIssues: number;
        mediumIssues: number;
        lowIssues: number;
    };
}
export declare const reviewCommand: SlashCommand;
/**
 * Handle user response to review results
 */
export declare function handleReviewResponse(response: string, report: ReviewReport, projectPath: string): Promise<CommandResult>;
export {};
