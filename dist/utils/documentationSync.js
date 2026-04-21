"use strict";
/**
 * Documentation Synchronization System
 * Implements the post-track documentation sync protocol as defined in the Conductor TOML specifications
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
exports.DocumentationSyncProtocol = void 0;
const path = __importStar(require("path"));
const fileSystem_1 = require("./fileSystem");
const markdown_1 = require("./markdown");
class DocumentationSyncProtocol {
    /**
     * Analyze the track specification for documentation updates
     */
    static async analyzeSpecification(context, track) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        const specPath = path.join(conductorDir, track.folderPath, 'spec.md');
        if (!(0, fileSystem_1.fileExists)(specPath)) {
            return {
                productChanges: [],
                techStackChanges: [],
                guidelineUpdates: [],
                impactedFiles: []
            };
        }
        const specContent = (0, fileSystem_1.readFile)(specPath);
        if (!specContent) {
            throw new Error(`Could not read specification file: ${specPath}`);
        }
        const spec = (0, markdown_1.parseSpecDocument)(specContent);
        // Analyze spec for potential documentation impacts
        const productChanges = [];
        const techStackChanges = [];
        const guidelineUpdates = [];
        // Extract potential product changes
        if (spec.description) {
            productChanges.push(`Track description: ${spec.description.substring(0, 100)}...`);
        }
        if (spec.requirements && spec.requirements.length > 0) {
            productChanges.push(...spec.requirements.slice(0, 5).map(req => req.title || req.description)); // Use title or description from requirement object
        }
        // Analyze technical aspects for tech stack changes
        if (spec.technicalNotes) {
            // Look for technology mentions in technical notes
            const techMatches = spec.technicalNotes.match(/\b(react|angular|vue|node|express|prisma|postgresql|mysql|typescript|javascript|python|java|spring|docker|kubernetes|aws|gcp|azure|mongo|redis|graphql|rest|api|microservices|monolith|architecture|design|pattern|testing|jest|cypress|mocha|chai|enzyme|storybook|webpack|vite|babel|eslint|prettier|husky|lint-staged|editorconfig|vscode|git|github|gitlab|bitbucket|npm|yarn|pnpm|package|dependency|library|framework)\b/gi);
            if (techMatches) {
                techStackChanges.push(...Array.from(new Set(techMatches.map((t) => t.toLowerCase()))));
            }
        }
        // Guidelines would typically come from implementation patterns
        guidelineUpdates.push(`Track completed: ${track.description}`);
        return {
            productChanges,
            techStackChanges,
            guidelineUpdates,
            impactedFiles: [specPath]
        };
    }
    /**
     * Update project-level documentation based on track completion
     */
    static async updateDocuments(context, _track, proposal) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        try {
            // Update product.md if needed
            if (proposal.productMdUpdates) {
                const productPath = path.join(conductorDir, 'product.md');
                if ((0, fileSystem_1.fileExists)(productPath)) {
                    const currentContent = (0, fileSystem_1.readFile)(productPath);
                    if (currentContent !== null) {
                        const updatedContent = this.mergeProductMd(currentContent, proposal.productMdUpdates);
                        (0, fileSystem_1.writeFile)(productPath, updatedContent);
                    }
                    else {
                        (0, fileSystem_1.writeFile)(productPath, proposal.productMdUpdates);
                    }
                }
                else {
                    (0, fileSystem_1.writeFile)(productPath, proposal.productMdUpdates);
                }
            }
            // Update tech-stack.md if needed
            if (proposal.techStackMdUpdates) {
                const techStackPath = path.join(conductorDir, 'tech-stack.md');
                if ((0, fileSystem_1.fileExists)(techStackPath)) {
                    const currentContent = (0, fileSystem_1.readFile)(techStackPath);
                    if (currentContent !== null) {
                        const updatedContent = this.mergeTechStackMd(currentContent, proposal.techStackMdUpdates);
                        (0, fileSystem_1.writeFile)(techStackPath, updatedContent);
                    }
                    else {
                        (0, fileSystem_1.writeFile)(techStackPath, proposal.techStackMdUpdates);
                    }
                }
                else {
                    (0, fileSystem_1.writeFile)(techStackPath, proposal.techStackMdUpdates);
                }
            }
            // Update product-guidelines.md if needed
            if (proposal.guidelinesMdUpdates) {
                const guidelinesPath = path.join(conductorDir, 'product-guidelines.md');
                if ((0, fileSystem_1.fileExists)(guidelinesPath)) {
                    const currentContent = (0, fileSystem_1.readFile)(guidelinesPath);
                    if (currentContent !== null) {
                        const updatedContent = this.mergeGuidelinesMd(currentContent, proposal.guidelinesMdUpdates);
                        (0, fileSystem_1.writeFile)(guidelinesPath, updatedContent);
                    }
                    else {
                        (0, fileSystem_1.writeFile)(guidelinesPath, proposal.guidelinesMdUpdates);
                    }
                }
                else {
                    (0, fileSystem_1.writeFile)(guidelinesPath, proposal.guidelinesMdUpdates);
                }
            }
            return {
                success: true,
                message: 'Documentation synchronization completed successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Documentation sync failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Generate proposal for documentation updates based on track completion
     */
    static async generateSyncProposal(context, track) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        const specPath = path.join(conductorDir, track.folderPath, 'spec.md');
        if (!(0, fileSystem_1.fileExists)(specPath)) {
            return {};
        }
        const specContent = (0, fileSystem_1.readFile)(specPath);
        if (!specContent) {
            return {};
        }
        const spec = (0, markdown_1.parseSpecDocument)(specContent);
        const proposal = {};
        // Generate product.md update suggestion
        if (spec.description || spec.requirements) {
            const timestamp = new Date().toISOString().split('T')[0];
            proposal.productMdUpdates = `# Product Updates - ${timestamp}\n\n`;
            if (spec.description) {
                proposal.productMdUpdates += `## New Feature: ${spec.description}\n\n`;
            }
            if (spec.requirements && spec.requirements.length > 0) {
                proposal.productMdUpdates += '### Requirements Implemented:\n';
                spec.requirements.forEach((req) => {
                    proposal.productMdUpdates += `- ${req}\n`;
                });
                proposal.productMdUpdates += '\n';
            }
            // Append existing product content
            const existingProduct = (0, fileSystem_1.readFile)(path.join(conductorDir, 'product.md'));
            if (existingProduct) {
                proposal.productMdUpdates += existingProduct;
            }
        }
        // Generate tech-stack.md update suggestion
        if (spec.technicalNotes) {
            const timestamp = new Date().toISOString().split('T')[0];
            proposal.techStackMdUpdates = `# Technology Updates - ${timestamp}\n\n`;
            if (spec.technicalNotes) {
                proposal.techStackMdUpdates += '## Technical Implementation Notes:\n';
                proposal.techStackMdUpdates += `${spec.technicalNotes}\n\n`;
            }
            // Append existing tech stack content
            const existingTechStack = (0, fileSystem_1.readFile)(path.join(conductorDir, 'tech-stack.md'));
            if (existingTechStack) {
                proposal.techStackMdUpdates += existingTechStack;
            }
        }
        // Generate spec comparison
        proposal.specMdComparison = `Track: ${track.description}\n`;
        proposal.specMdComparison += `Status: Completed on ${new Date().toISOString()}\n\n`;
        proposal.specMdComparison += `## Original Spec:\n${specContent}\n\n`;
        return proposal;
    }
    /**
     * Merge new content with existing product.md content
     */
    static mergeProductMd(existing, newContent) {
        if (!existing)
            return newContent;
        // For simplicity, append new content after existing content
        // In a real implementation, this would be more sophisticated
        return `${existing}\n\n${newContent}`;
    }
    /**
     * Merge new content with existing tech-stack.md content
     */
    static mergeTechStackMd(existing, newContent) {
        if (!existing)
            return newContent;
        // For simplicity, append new content after existing content
        // In a real implementation, this would be more sophisticated
        return `${existing}\n\n${newContent}`;
    }
    /**
     * Merge new content with existing product-guidelines.md content
     */
    static mergeGuidelinesMd(existing, newContent) {
        if (!existing)
            return newContent;
        // For simplicity, append new content after existing content
        // In a real implementation, this would be more sophisticated
        return `${existing}\n\n${newContent}`;
    }
}
exports.DocumentationSyncProtocol = DocumentationSyncProtocol;
