/**
 * Documentation Synchronization System
 * Implements the post-track documentation sync protocol as defined in the Conductor TOML specifications
 */

import * as path from 'path';
import type { CommandContext, CommandResult, Track } from '../types';
import { fileExists, readFile, writeFile, resolveConductorDir } from './fileSystem';
import { parseSpecDocument } from './markdown';

export interface DocSyncAnalysis {
  productChanges: string[];
  techStackChanges: string[];
  guidelineUpdates: string[];
  impactedFiles: string[];
}

export interface DocSyncProposal {
  productMdUpdates?: string;
  techStackMdUpdates?: string;
  guidelinesMdUpdates?: string;
  specMdComparison?: string;
}

export class DocumentationSyncProtocol {
  /**
   * Analyze the track specification for documentation updates
   */
  static async analyzeSpecification(context: CommandContext, track: Track): Promise<DocSyncAnalysis> {
    const conductorDir = resolveConductorDir(context.projectRoot);
    const specPath = path.join(conductorDir, track.folderPath, 'spec.md');

    if (!fileExists(specPath)) {
      return {
        productChanges: [],
        techStackChanges: [],
        guidelineUpdates: [],
        impactedFiles: []
      };
    }

    const specContent = readFile(specPath);
    if (!specContent) {
      throw new Error(`Could not read specification file: ${specPath}`);
    }

    const spec = parseSpecDocument(specContent);

    // Analyze spec for potential documentation impacts
    const productChanges: string[] = [];
    const techStackChanges: string[] = [];
    const guidelineUpdates: string[] = [];

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
        techStackChanges.push(...Array.from(new Set(techMatches.map((t: string) => t.toLowerCase()))));
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
  static async updateDocuments(context: CommandContext, _track: Track, proposal: DocSyncProposal): Promise<CommandResult> {
    const conductorDir = resolveConductorDir(context.projectRoot);

    try {
      // Update product.md if needed
      if (proposal.productMdUpdates) {
        const productPath = path.join(conductorDir, 'product.md');

        if (fileExists(productPath)) {
          const currentContent = readFile(productPath);
          if (currentContent !== null) {
            const updatedContent = this.mergeProductMd(currentContent, proposal.productMdUpdates);
            writeFile(productPath, updatedContent);
          } else {
            writeFile(productPath, proposal.productMdUpdates);
          }
        } else {
          writeFile(productPath, proposal.productMdUpdates);
        }
      }

      // Update tech-stack.md if needed
      if (proposal.techStackMdUpdates) {
        const techStackPath = path.join(conductorDir, 'tech-stack.md');

        if (fileExists(techStackPath)) {
          const currentContent = readFile(techStackPath);
          if (currentContent !== null) {
            const updatedContent = this.mergeTechStackMd(currentContent, proposal.techStackMdUpdates);
            writeFile(techStackPath, updatedContent);
          } else {
            writeFile(techStackPath, proposal.techStackMdUpdates);
          }
        } else {
          writeFile(techStackPath, proposal.techStackMdUpdates);
        }
      }

      // Update product-guidelines.md if needed
      if (proposal.guidelinesMdUpdates) {
        const guidelinesPath = path.join(conductorDir, 'product-guidelines.md');

        if (fileExists(guidelinesPath)) {
          const currentContent = readFile(guidelinesPath);
          if (currentContent !== null) {
            const updatedContent = this.mergeGuidelinesMd(currentContent, proposal.guidelinesMdUpdates);
            writeFile(guidelinesPath, updatedContent);
          } else {
            writeFile(guidelinesPath, proposal.guidelinesMdUpdates);
          }
        } else {
          writeFile(guidelinesPath, proposal.guidelinesMdUpdates);
        }
      }

      return {
        success: true,
        message: 'Documentation synchronization completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Documentation sync failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Generate proposal for documentation updates based on track completion
   */
  static async generateSyncProposal(context: CommandContext, track: Track): Promise<DocSyncProposal> {
    const conductorDir = resolveConductorDir(context.projectRoot);
    const specPath = path.join(conductorDir, track.folderPath, 'spec.md');

    if (!fileExists(specPath)) {
      return {};
    }

    const specContent = readFile(specPath);
    if (!specContent) {
      return {};
    }

    const spec = parseSpecDocument(specContent);

    const proposal: DocSyncProposal = {};

    // Generate product.md update suggestion
    if (spec.description || spec.requirements) {
      const timestamp = new Date().toISOString().split('T')[0];

      proposal.productMdUpdates = `# Product Updates - ${timestamp}\n\n`;

      if (spec.description) {
        proposal.productMdUpdates += `## New Feature: ${spec.description}\n\n`;
      }

      if (spec.requirements && spec.requirements.length > 0) {
        proposal.productMdUpdates += '### Requirements Implemented:\n';
        spec.requirements.forEach((req: any) => {
          proposal.productMdUpdates += `- ${req}\n`;
        });
        proposal.productMdUpdates += '\n';
      }

      // Append existing product content
      const existingProduct = readFile(path.join(conductorDir, 'product.md'));
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
      const existingTechStack = readFile(path.join(conductorDir, 'tech-stack.md'));
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
  private static mergeProductMd(existing: string, newContent: string): string {
    if (!existing) return newContent;

    // For simplicity, append new content after existing content
    // In a real implementation, this would be more sophisticated
    return `${existing}\n\n${newContent}`;
  }

  /**
   * Merge new content with existing tech-stack.md content
   */
  private static mergeTechStackMd(existing: string, newContent: string): string {
    if (!existing) return newContent;

    // For simplicity, append new content after existing content
    // In a real implementation, this would be more sophisticated
    return `${existing}\n\n${newContent}`;
  }

  /**
   * Merge new content with existing product-guidelines.md content
   */
  private static mergeGuidelinesMd(existing: string, newContent: string): string {
    if (!existing) return newContent;

    // For simplicity, append new content after existing content
    // In a real implementation, this would be more sophisticated
    return `${existing}\n\n${newContent}`;
  }
}