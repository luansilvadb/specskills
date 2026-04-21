/**
 * Plan Mode System for Conductor
 * Implements the planning mode functionality as defined in the Conductor TOML specifications
 */
import type { CommandContext, CommandResult, PlanModePolicy } from '../types';
export interface PlanModeSession {
    isActive: boolean;
    planId: string;
    createdAt: Date;
    modifiedAt: Date;
    commandsExecuted: number;
    policy: PlanModePolicy;
}
export declare class PlanModeManager {
    private static session;
    /**
     * Activate Plan Mode with the given policy
     */
    static activate(policy: PlanModePolicy, planId?: string): PlanModeSession;
    /**
     * Deactivate Plan Mode
     */
    static deactivate(): void;
    /**
     * Get current Plan Mode session
     */
    static getSession(): PlanModeSession | null;
    /**
     * Check if a command is allowed in Plan Mode based on policy
     */
    static isCommandAllowed(commandName: string): boolean;
    /**
     * Register command execution in Plan Mode
     */
    static registerCommandExecution(): void;
    /**
     * Check if current session exceeds execution limits
     */
    static exceedsExecutionLimits(): boolean;
    /**
     * Validate Plan Mode permissions for a specific operation
     */
    static validatePermission(operation: string, _details?: any): {
        allowed: boolean;
        reason?: string;
    };
}
/**
 * Middleware to wrap command execution with Plan Mode checks
 */
export declare function withPlanModeProtection(commandName: string, _context: CommandContext, commandFn: () => Promise<CommandResult>): Promise<CommandResult>;
