/**
 * Skill Orchestration Engine
 * Handles execution of skills with dependencies and inter-skill calls
 */
import type { Skill } from '../types';
import { SkillCompositionEngine } from './skillComposition';
export interface SkillExecutionResult {
    success: boolean;
    output: Record<string, any>;
    messages: string[];
    errors: string[];
}
export declare class SkillOrchestrationEngine {
    private skillCompositionEngine;
    constructor(compositionEngine: SkillCompositionEngine);
    /**
     * Execute a skill with support for calling other skills declaratively
     */
    executeSkill(skill: Skill, context: Record<string, any>, allSkills: Skill[]): Promise<SkillExecutionResult>;
    /**
     * Execute the main logic of a skill
     */
    private executeSkillLogic;
    /**
     * Execute calls to other skills as declared in the skill's protocol
     */
    private executeSkillCalls;
    /**
     * Check if all dependencies for a skill are satisfied
     */
    private checkDependencies;
    /**
     * Apply directives to modify context or execution
     */
    private applyDirectives;
    /**
     * Execute a protocol string with support for skill calls
     */
    private executeProtocol;
    /**
     * Execute a sequence of skills
     */
    executeSkillSequence(skillIds: string[], initialContext: Record<string, any>, allSkills: Skill[]): Promise<SkillExecutionResult>;
    /**
     * Resolve skill dependencies and return execution order
     */
    resolveDependencyOrder(skillIds: string[], allSkills: Skill[]): string[];
}
