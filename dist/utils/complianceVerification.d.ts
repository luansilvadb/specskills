/**
 * Automatic Compliance Verification System for Conductor
 * Verifies that implementation conforms to project guidelines and best practices
 */
import type { CommandContext } from '../types';
export interface ComplianceRule {
    id: string;
    name: string;
    description: string;
    category: 'security' | 'performance' | 'maintainability' | 'style' | 'architecture' | 'testing' | 'documentation';
    severity: 'error' | 'warning' | 'info';
    applicableFiles?: string[];
    checkFunction: (filePath: string, content: string, context: CommandContext) => boolean | Promise<boolean>;
    messageOnViolation?: string;
}
export interface ComplianceReport {
    timestamp: string;
    projectId: string;
    trackId?: string;
    violations: ComplianceViolation[];
    summary: ComplianceSummary;
    configFileUsed: string;
}
export interface ComplianceViolation {
    ruleId: string;
    ruleName: string;
    filePath: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    category: string;
    line?: number;
    codeSnippet?: string;
}
export interface ComplianceSummary {
    totalRules: number;
    passedRules: number;
    failedRules: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    compliancePercentage: number;
}
export interface ProjectGuidelines {
    projectName: string;
    description: string;
    guidelines: {
        codeStyle: string;
        security: string;
        performance: string;
        testing: string;
        documentation: string;
        architecture: string;
    };
    customRules?: ComplianceRule[];
    enabledCategories: string[];
    excludePatterns?: string[];
}
export declare class ComplianceVerificationSystem {
    private rules;
    private guidelines;
    constructor();
    /**
     * Initialize default compliance rules
     */
    private initializeDefaultRules;
    /**
     * Load project guidelines from file
     */
    loadProjectGuidelines(context: CommandContext): Promise<void>;
    /**
     * Parse guidelines from markdown content
     */
    private parseGuidelines;
    /**
     * Add a custom rule
     */
    addCustomRule(rule: ComplianceRule): void;
    /**
     * Run compliance verification on specified files
     */
    verifyCompliance(context: CommandContext, filesToCheck: string[], categories?: string[]): Promise<ComplianceReport>;
    /**
     * Run compliance verification on all tracked files in the current track
     */
    verifyTrackCompliance(context: CommandContext, trackId: string): Promise<ComplianceReport>;
    /**
     * Get filtered rules based on categories
     */
    private getFilteredRules;
    /**
     * Check if a file matches any exclusion patterns
     */
    private isFileExcluded;
    /**
     * Check if a file matches any of the applicable file patterns
     */
    private isFileApplicable;
    /**
     * Generate summary statistics from violations
     */
    private generateSummary;
    /**
     * Get all files in a directory recursively
     */
    private getAllFilesInDirectory;
    /**
     * Generate a human-readable compliance report
     */
    generateHumanReadableReport(report: ComplianceReport): string;
    /**
     * Check if compliance requirements are met for a given threshold
     */
    isComplianceMet(report: ComplianceReport, minCompliancePercent?: number): boolean;
    /**
     * Get all available rule IDs by category
     */
    getRulesByCategory(category?: string): ComplianceRule[];
}
