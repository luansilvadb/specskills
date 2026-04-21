/**
 * Skill Composition System for Conductor
 * Enables composition and orchestration of multiple skills in custom workflows
 */
import type { Skill, SkillWithScore } from '../types';
export interface SkillComposition {
    id: string;
    name: string;
    description: string;
    skills: Skill[];
    dependencies: string[];
    executionOrder: string[];
    triggerConditions: string[];
}
export interface SkillOrchestrationConfig {
    skillId: string;
    priority: number;
    dependencies: string[];
    executionContext: string;
    parameters?: Record<string, any>;
}
export declare class SkillCompositionEngine {
    private compositions;
    /**
     * Register a new skill composition
     */
    registerComposition(composition: SkillComposition): void;
    /**
     * Get a skill composition by ID
     */
    getComposition(id: string): SkillComposition | undefined;
    /**
     * Find compositions that match the given trigger conditions
     */
    findMatchingCompositions(triggerConditions: string[]): SkillComposition[];
    /**
     * Execute a skill composition
     */
    executeComposition(composition: SkillComposition, context: Record<string, any>, parameters?: Record<string, any>): Promise<Record<string, any>>;
    /**
     * Execute a single skill in the context of a composition
     */
    private executeSingleSkill;
    /**
     * Apply directives to modify context or execution
     */
    private applyDirectives;
    /**
     * Execute a protocol string in the context
     */
    private executeProtocol;
    /**
     * Validate that all dependencies are resolved
     */
    private validateDependencies;
    /**
     * Create a composition from related skills
     */
    createCompositionFromSkills(id: string, name: string, description: string, skills: Skill[], triggerConditions: string[]): SkillComposition;
}
/**
 * Enhanced skill recommender that considers composition possibilities
 */
export declare class CompositeSkillRecommender {
    private compositionEngine;
    constructor(engine: SkillCompositionEngine);
    /**
     * Recommend individual skills and composite skill groups
     */
    recommendSkillsAndCompositions(contextDescription: string, allSkills: Skill[]): {
        skills: SkillWithScore[];
        compositions: SkillComposition[];
    };
    /**
     * Find potential compositions from recommended skills
     */
    private findPotentialCompositions;
}
