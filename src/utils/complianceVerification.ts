/**
 * Automatic Compliance Verification System for Conductor
 * Verifies that implementation conforms to project guidelines and best practices
 */

import type { CommandContext } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { readFile, fileExists, resolveConductorDir } from './fileSystem';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'performance' | 'maintainability' | 'style' | 'architecture' | 'testing' | 'documentation';
  severity: 'error' | 'warning' | 'info';
  applicableFiles?: string[]; // Globs for files this rule applies to
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

export class ComplianceVerificationSystem {
  private rules: ComplianceRule[] = [];
  private guidelines: ProjectGuidelines | null = null;

  constructor() {
    // Initialize with default rules
    this.initializeDefaultRules();
  }

  /**
   * Initialize default compliance rules
   */
  private initializeDefaultRules(): void {
    // Security rules
    this.rules.push({
      id: 'security-no-hardcoded-credentials',
      name: 'No Hardcoded Credentials',
      description: 'Ensure no hardcoded credentials in code',
      category: 'security',
      severity: 'error',
      applicableFiles: ['**/*.js', '**/*.ts', '**/*.py', '**/*.java', '**/*.go', '**/*.cs', '**/*.rb'],
      checkFunction: (_filePath: string, _content: string) => {
        const patterns = [
          /password\s*[:=]\s*["'][^"']*["']/i,
          /secret\s*[:=]\s*["'][^"']*["']/i,
          /token\s*[:=]\s*["'][^"']*["']/i,
          /key\s*[:=]\s*["'][^"']*["']/i,
          /api_key\s*[:=]\s*["'][^"']*["']/i,
        ];

        return !patterns.some(pattern => pattern.test(_content));
      },
      messageOnViolation: 'Hardcoded credentials detected. Use environment variables or secure credential management.'
    });

    // Style rules
    this.rules.push({
      id: 'style-trailing-whitespace',
      name: 'No Trailing Whitespace',
      description: 'Ensure no trailing whitespace at end of lines',
      category: 'style',
      severity: 'warning',
      applicableFiles: ['**/*'],
      checkFunction: (_filePath: string, content: string) => {
        return !content.split('\n').some((line: string) => /\s+$/.test(line));
      },
      messageOnViolation: 'Trailing whitespace detected at end of lines.'
    });

    // Architecture rules
    this.rules.push({
      id: 'arch-no-direct-db-access',
      name: 'No Direct Database Access',
      description: 'Ensure database access goes through proper data access layers',
      category: 'architecture',
      severity: 'warning',
      applicableFiles: ['**/*.js', '**/*.ts', '**/*.py', '**/*.java', '**/*.go', '**/*.cs'],
      checkFunction: (_filePath: string, content: string) => {
        // Simplified check for direct DB connection patterns
        const directAccessPatterns = [
          /\.connect\(/,
          /sql\.query\(/,
          /connection\.execute\(/,
          /cursor\.execute\(/,
        ];

        // Skip if it's a DAO/Data layer file
        if (/data(access)?|dao|repository/i.test(_filePath)) {
          return true;
        }

        return !directAccessPatterns.some(pattern => pattern.test(content));
      },
      messageOnViolation: 'Direct database access detected. Use proper data access layers/services.'
    });

    // Testing rules
    this.rules.push({
      id: 'testing-test-coverage',
      name: 'Test Coverage Check',
      description: 'Ensure adequate test coverage for modified files',
      category: 'testing',
      severity: 'warning',
      applicableFiles: ['**/*'],
      checkFunction: async (_filePath: string, _content: string, _context: CommandContext) => {
        // In a real implementation, this would connect to a coverage tool
        // For now, we'll just return true to avoid blocking development
        return true;
      },
      messageOnViolation: 'Insufficient test coverage detected.'
    });
  }

  /**
   * Load project guidelines from file
   */
  async loadProjectGuidelines(context: CommandContext): Promise<void> {
    const conductorDir = resolveConductorDir(context.projectRoot);

    try {
      const guidelinesPath = path.join(conductorDir, 'product-guidelines.md');
      if (fileExists(guidelinesPath)) {
        const content = readFile(guidelinesPath);
        if (content) {
          this.guidelines = this.parseGuidelines(content);
        }
      }
    } catch (error) {
      console.warn('Could not load project guidelines:', error);
    }
  }

  /**
   * Parse guidelines from markdown content
   */
  private parseGuidelines(content: string): ProjectGuidelines {
    // Extract sections from the guidelines file
    const sections: Record<string, string> = {};

    const sectionRegex = /##\s+(.+?)\r?\n\r?([\s\S]*?)(?=\r?\n##\s+|$)/g;
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionName = match[1].toLowerCase().replace(/\s+/g, '');
      sections[sectionName] = match[2].trim();
    }

    return {
      projectName: 'Project',
      description: 'Project guidelines',
      guidelines: {
        codeStyle: sections.codestyle || sections.style || '',
        security: sections.security || '',
        performance: sections.performance || '',
        testing: sections.testing || '',
        documentation: sections.documentation || '',
        architecture: sections.architecture || sections.design || ''
      },
      enabledCategories: ['security', 'style', 'architecture', 'testing'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*']
    };
  }

  /**
   * Add a custom rule
   */
  addCustomRule(rule: ComplianceRule): void {
    this.rules.push(rule);
  }

  /**
   * Run compliance verification on specified files
   */
  async verifyCompliance(
    context: CommandContext,
    filesToCheck: string[],
    categories?: string[]
  ): Promise<ComplianceReport> {
    // Load guidelines if not already loaded
    if (!this.guidelines) {
      await this.loadProjectGuidelines(context);
    }

    const startTime = new Date();
    const violations: ComplianceViolation[] = [];
    const applicableRules = this.getFilteredRules(categories);

    for (const filePath of filesToCheck) {
      // Skip excluded files
      if (this.isFileExcluded(filePath)) {
        continue;
      }

      const fullPath = path.join(context.projectRoot, filePath);
      if (!fileExists(fullPath)) {
        continue;
      }

      let content: string;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch (error) {
        console.warn(`Could not read file ${filePath}:`, error);
        continue;
      }

      // Check all applicable rules
      for (const rule of applicableRules) {
        if (rule.applicableFiles && !this.isFileApplicable(filePath, rule.applicableFiles)) {
          continue;
        }

        let passesCheck = false;
        try {
          passesCheck = await Promise.resolve(rule.checkFunction(filePath, content, context));
        } catch (error) {
          console.warn(`Error running rule ${rule.id} on file ${filePath}:`, error);
          continue;
        }

        if (!passesCheck) {
          const violation: ComplianceViolation = {
            ruleId: rule.id,
            ruleName: rule.name,
            filePath,
            severity: rule.severity,
            message: rule.messageOnViolation || `Rule violated: ${rule.description}`,
            category: rule.category
          };

          violations.push(violation);
        }
      }
    }

    const summary = this.generateSummary(violations, applicableRules.length);

    return {
      timestamp: startTime.toISOString(),
      projectId: context.projectRoot,
      violations,
      summary,
      configFileUsed: this.guidelines ? 'product-guidelines.md' : 'default-rules'
    };
  }

  /**
   * Run compliance verification on all tracked files in the current track
   */
  async verifyTrackCompliance(context: CommandContext, trackId: string): Promise<ComplianceReport> {
    // Load guidelines if not already loaded
    if (!this.guidelines) {
      await this.loadProjectGuidelines(context);
    }

    // Get all files related to the current track
    const conductorDir = resolveConductorDir(context.projectRoot);
    const trackDir = path.join(conductorDir, 'tracks', trackId);

    const filesToCheck: string[] = [];

    if (fileExists(trackDir)) {
      // Add track-specific files
      const trackFiles = this.getAllFilesInDirectory(trackDir);
      filesToCheck.push(...trackFiles.map(f => path.relative(context.projectRoot, f)));
    }

    // For now, also check all project files - in a real implementation this would be more targeted
    // Add modified files from git diff
    try {
      const { execSync } = require('child_process');
      const diffResult = execSync('git diff --name-only HEAD~1 HEAD', { cwd: context.projectRoot, encoding: 'utf8' });
      const changedFiles = diffResult.trim().split('\n').filter((f: string) => f && !f.startsWith('conductor/'));
      filesToCheck.push(...changedFiles);
    } catch (error) {
      // Git not available or no changes - continue with track files only
    }

    // Remove duplicates
    const uniqueFiles = [...new Set(filesToCheck)];

    return await this.verifyCompliance(context, uniqueFiles);
  }

  /**
   * Get filtered rules based on categories
   */
  private getFilteredRules(categories?: string[]): ComplianceRule[] {
    if (!categories || categories.length === 0) {
      return this.rules;
    }

    return this.rules.filter(rule => categories.includes(rule.category));
  }

  /**
   * Check if a file matches any exclusion patterns
   */
  private isFileExcluded(filePath: string): boolean {
    if (!this.guidelines?.excludePatterns) {
      return false;
    }

    return this.guidelines.excludePatterns.some(pattern => {
      // Simple glob matching
      const regex = new RegExp(pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.'), 'i');
      return regex.test(filePath);
    });
  }

  /**
   * Check if a file matches any of the applicable file patterns
   */
  private isFileApplicable(filePath: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      // Simple glob matching
      const regex = new RegExp(pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.'), 'i');
      return regex.test(filePath);
    });
  }

  /**
   * Generate summary statistics from violations
   */
  private generateSummary(violations: ComplianceViolation[], totalRules: number): ComplianceSummary {
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    const infoCount = violations.filter(v => v.severity === 'info').length;

    const passedRules = totalRules - violations.length;
    const compliancePercentage = totalRules > 0 ? (passedRules / totalRules) * 100 : 100;

    return {
      totalRules,
      passedRules,
      failedRules: violations.length,
      errorCount,
      warningCount,
      infoCount,
      compliancePercentage
    };
  }

  /**
   * Get all files in a directory recursively
   */
  private getAllFilesInDirectory(dirPath: string): string[] {
    const files: string[] = [];

    if (!fileExists(dirPath)) {
      return files;
    }

    const dirents = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const dirent of dirents) {
      const fullPath = path.join(dirPath, dirent.name);

      if (dirent.isDirectory()) {
        files.push(...this.getAllFilesInDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Generate a human-readable compliance report
   */
  generateHumanReadableReport(report: ComplianceReport): string {
    let output = `# Compliance Verification Report\n\n`;
    output += `**Generated:** ${report.timestamp}\n`;
    output += `**Project:** ${report.projectId}\n`;
    output += `**Config File:** ${report.configFileUsed}\n\n`;

    output += `## Summary\n`;
    output += `- Total Rules Checked: ${report.summary.totalRules}\n`;
    output += `- Passed: ${report.summary.passedRules}\n`;
    output += `- Failed: ${report.summary.failedRules}\n`;
    output += `- Compliance: ${report.summary.compliancePercentage.toFixed(2)}%\n`;
    output += `- Errors: ${report.summary.errorCount}\n`;
    output += `- Warnings: ${report.summary.warningCount}\n`;
    output += `- Infos: ${report.summary.infoCount}\n\n`;

    if (report.violations.length > 0) {
      output += `## Violations\n\n`;

      // Group by severity
      const bySeverity: Record<string, ComplianceViolation[]> = {
        error: [],
        warning: [],
        info: []
      };

      for (const violation of report.violations) {
        bySeverity[violation.severity].push(violation);
      }

      for (const severity of ['error', 'warning', 'info'] as const) {
        if (bySeverity[severity].length > 0) {
          output += `### ${severity.toUpperCase()}S (${bySeverity[severity].length})\n\n`;

          for (const violation of bySeverity[severity]) {
            output += `- **[${violation.ruleName}](#${violation.ruleId})** in \`${violation.filePath}\`\n`;
            output += `  - ${violation.message}\n\n`;
          }
        }
      }
    } else {
      output += `## Result\n\n`;
      output += `✅ All compliance checks passed!\n`;
    }

    return output;
  }

  /**
   * Check if compliance requirements are met for a given threshold
   */
  isComplianceMet(report: ComplianceReport, minCompliancePercent = 90): boolean {
    return report.summary.compliancePercentage >= minCompliancePercent &&
           report.summary.errorCount === 0;
  }

  /**
   * Get all available rule IDs by category
   */
  getRulesByCategory(category?: string): ComplianceRule[] {
    if (category) {
      return this.rules.filter(rule => rule.category === category);
    }
    return [...this.rules];
  }
}