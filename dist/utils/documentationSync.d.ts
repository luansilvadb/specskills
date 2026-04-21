/**
 * Documentation Synchronization System
 * Implements the post-track documentation sync protocol as defined in the Conductor TOML specifications
 */
import type { CommandContext, CommandResult, Track } from '../types';
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
export declare class DocumentationSyncProtocol {
    /**
     * Analyze the track specification for documentation updates
     */
    static analyzeSpecification(context: CommandContext, track: Track): Promise<DocSyncAnalysis>;
    /**
     * Update project-level documentation based on track completion
     */
    static updateDocuments(context: CommandContext, _track: Track, proposal: DocSyncProposal): Promise<CommandResult>;
    /**
     * Generate proposal for documentation updates based on track completion
     */
    static generateSyncProposal(context: CommandContext, track: Track): Promise<DocSyncProposal>;
    /**
     * Merge new content with existing product.md content
     */
    private static mergeProductMd;
    /**
     * Merge new content with existing tech-stack.md content
     */
    private static mergeTechStackMd;
    /**
     * Merge new content with existing product-guidelines.md content
     */
    private static mergeGuidelinesMd;
}
