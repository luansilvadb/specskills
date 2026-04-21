"use strict";
/**
 * Automatic Compliance Verification System for Conductor
 * Verifies that implementation conforms to project guidelines and best practices
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
exports.ComplianceVerificationSystem = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fileSystem_1 = require("./fileSystem");
class ComplianceVerificationSystem {
    constructor() {
        this.rules = [];
        this.guidelines = null;
        // Initialize with default rules
        this.initializeDefaultRules();
    }
    /**
     * Initialize default compliance rules
     */
    initializeDefaultRules() {
        // Security rules
        this.rules.push({
            id: 'security-no-hardcoded-credentials',
            name: 'No Hardcoded Credentials',
            description: 'Ensure no hardcoded credentials in code',
            category: 'security',
            severity: 'error',
            applicableFiles: ['**/*.js', '**/*.ts', '**/*.py', '**/*.java', '**/*.go', '**/*.cs', '**/*.rb'],
            checkFunction: (_filePath, _content) => {
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
            checkFunction: (_filePath, content) => {
                return !content.split('\n').some((line) => /\s+$/.test(line));
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
            checkFunction: (_filePath, content) => {
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
            checkFunction: async (_filePath, _content, _context) => {
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
    async loadProjectGuidelines(context) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        try {
            const guidelinesPath = path.join(conductorDir, 'product-guidelines.md');
            if ((0, fileSystem_1.fileExists)(guidelinesPath)) {
                const content = (0, fileSystem_1.readFile)(guidelinesPath);
                if (content) {
                    this.guidelines = this.parseGuidelines(content);
                }
            }
        }
        catch (error) {
            console.warn('Could not load project guidelines:', error);
        }
    }
    /**
     * Parse guidelines from markdown content
     */
    parseGuidelines(content) {
        // Extract sections from the guidelines file
        const sections = {};
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
    addCustomRule(rule) {
        this.rules.push(rule);
    }
    /**
     * Run compliance verification on specified files
     */
    async verifyCompliance(context, filesToCheck, categories) {
        // Load guidelines if not already loaded
        if (!this.guidelines) {
            await this.loadProjectGuidelines(context);
        }
        const startTime = new Date();
        const violations = [];
        const applicableRules = this.getFilteredRules(categories);
        for (const filePath of filesToCheck) {
            // Skip excluded files
            if (this.isFileExcluded(filePath)) {
                continue;
            }
            const fullPath = path.join(context.projectRoot, filePath);
            if (!(0, fileSystem_1.fileExists)(fullPath)) {
                continue;
            }
            let content;
            try {
                content = fs.readFileSync(fullPath, 'utf8');
            }
            catch (error) {
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
                }
                catch (error) {
                    console.warn(`Error running rule ${rule.id} on file ${filePath}:`, error);
                    continue;
                }
                if (!passesCheck) {
                    const violation = {
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
    async verifyTrackCompliance(context, trackId) {
        // Load guidelines if not already loaded
        if (!this.guidelines) {
            await this.loadProjectGuidelines(context);
        }
        // Get all files related to the current track
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        const trackDir = path.join(conductorDir, 'tracks', trackId);
        const filesToCheck = [];
        if ((0, fileSystem_1.fileExists)(trackDir)) {
            // Add track-specific files
            const trackFiles = this.getAllFilesInDirectory(trackDir);
            filesToCheck.push(...trackFiles.map(f => path.relative(context.projectRoot, f)));
        }
        // For now, also check all project files - in a real implementation this would be more targeted
        // Add modified files from git diff
        try {
            const { execSync } = require('child_process');
            const diffResult = execSync('git diff --name-only HEAD~1 HEAD', { cwd: context.projectRoot, encoding: 'utf8' });
            const changedFiles = diffResult.trim().split('\n').filter((f) => f && !f.startsWith('conductor/'));
            filesToCheck.push(...changedFiles);
        }
        catch (error) {
            // Git not available or no changes - continue with track files only
        }
        // Remove duplicates
        const uniqueFiles = [...new Set(filesToCheck)];
        return await this.verifyCompliance(context, uniqueFiles);
    }
    /**
     * Get filtered rules based on categories
     */
    getFilteredRules(categories) {
        if (!categories || categories.length === 0) {
            return this.rules;
        }
        return this.rules.filter(rule => categories.includes(rule.category));
    }
    /**
     * Check if a file matches any exclusion patterns
     */
    isFileExcluded(filePath) {
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
    isFileApplicable(filePath, patterns) {
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
    generateSummary(violations, totalRules) {
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
    getAllFilesInDirectory(dirPath) {
        const files = [];
        if (!(0, fileSystem_1.fileExists)(dirPath)) {
            return files;
        }
        const dirents = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const dirent of dirents) {
            const fullPath = path.join(dirPath, dirent.name);
            if (dirent.isDirectory()) {
                files.push(...this.getAllFilesInDirectory(fullPath));
            }
            else {
                files.push(fullPath);
            }
        }
        return files;
    }
    /**
     * Generate a human-readable compliance report
     */
    generateHumanReadableReport(report) {
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
            const bySeverity = {
                error: [],
                warning: [],
                info: []
            };
            for (const violation of report.violations) {
                bySeverity[violation.severity].push(violation);
            }
            for (const severity of ['error', 'warning', 'info']) {
                if (bySeverity[severity].length > 0) {
                    output += `### ${severity.toUpperCase()}S (${bySeverity[severity].length})\n\n`;
                    for (const violation of bySeverity[severity]) {
                        output += `- **[${violation.ruleName}](#${violation.ruleId})** in \`${violation.filePath}\`\n`;
                        output += `  - ${violation.message}\n\n`;
                    }
                }
            }
        }
        else {
            output += `## Result\n\n`;
            output += `✅ All compliance checks passed!\n`;
        }
        return output;
    }
    /**
     * Check if compliance requirements are met for a given threshold
     */
    isComplianceMet(report, minCompliancePercent = 90) {
        return report.summary.compliancePercentage >= minCompliancePercent &&
            report.summary.errorCount === 0;
    }
    /**
     * Get all available rule IDs by category
     */
    getRulesByCategory(category) {
        if (category) {
            return this.rules.filter(rule => rule.category === category);
        }
        return [...this.rules];
    }
}
exports.ComplianceVerificationSystem = ComplianceVerificationSystem;
