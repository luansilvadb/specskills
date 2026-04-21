/**
 * Type-based validators for Conductor specs and plans
 * Provides validation functions based on the extended TypeScript interfaces
 */
import type { SpecDocument, PlanDocument, Requirement, AcceptanceCriterion, Phase, Task, Risk, PlanDependency, Timeline, Milestone, Resource } from '../types';
export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}
export declare class SpecValidator {
    /**
     * Validates a complete spec document
     */
    static validateSpec(spec: SpecDocument): ValidationResult;
    /**
     * Validates a single requirement
     */
    static validateRequirement(requirement: Requirement): ValidationResult;
    /**
     * Validates a single acceptance criterion
     */
    static validateAcceptanceCriterion(criterion: AcceptanceCriterion): ValidationResult;
    /**
     * Validates a single risk
     */
    static validateRisk(risk: Risk): ValidationResult;
}
export declare class PlanValidator {
    /**
     * Validates a complete plan document
     */
    static validatePlan(plan: PlanDocument): ValidationResult;
    /**
     * Validates a single phase
     */
    static validatePhase(phase: Phase): ValidationResult;
    /**
     * Validates a single task
     */
    static validateTask(task: Task): ValidationResult;
    /**
     * Validates a plan dependency
     */
    static validatePlanDependency(dependency: PlanDependency): ValidationResult;
    /**
     * Validates a timeline
     */
    static validateTimeline(timeline: Timeline): ValidationResult;
    /**
     * Validates a milestone
     */
    static validateMilestone(milestone: Milestone): ValidationResult;
    /**
     * Validates a resource
     */
    static validateResource(resource: Resource): ValidationResult;
}
