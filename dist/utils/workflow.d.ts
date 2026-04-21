/**
 * Workflow System for Conductor
 * Implements the workflow protocol as defined in the Conductor TOML specifications
 */
import type { CommandContext, CommandResult, Workflow } from '../types';
export interface WorkflowExecutionState {
    currentStep: number;
    completedSteps: string[];
    startTime: Date;
    lastUpdated: Date;
    metadata: Record<string, any>;
}
export declare class WorkflowManager {
    /**
     * Load workflow configuration from file
     */
    static loadWorkflow(context: CommandContext): Workflow | null;
    /**
     * Parse workflow from markdown content
     */
    private static parseWorkflow;
    /**
     * Generate a step ID from its title
     */
    private static generateStepId;
    /**
     * Execute workflow starting from the current state
     */
    static executeWorkflow(context: CommandContext, workflow: Workflow, initialState?: Partial<WorkflowExecutionState>): Promise<CommandResult>;
    /**
     * Execute a single workflow step
     */
    private static executeStep;
    /**
     * Check if execution should be interrupted
     */
    private static checkInterruption;
    /**
     * Get workflow checkpoint (current execution state)
     */
    static getCheckpoint(state: WorkflowExecutionState): string;
    /**
     * Create a delay for simulation purposes
     */
    private static delay;
    /**
     * Validate workflow configuration
     */
    static validateWorkflow(workflow: Workflow): {
        isValid: boolean;
        errors: string[];
    };
}
