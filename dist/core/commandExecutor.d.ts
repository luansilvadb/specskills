/**
 * Central Command Executor for Conductor
 * Coordinates all protocol systems and manages command execution flow
 */
import type { CommandContext, CommandResult, PlanModePolicy } from '../types';
import { BaseCommandFlow } from '../utils/commandFlow';
export interface CommandExecutorOptions {
    enablePlanMode?: boolean;
    planModePolicy?: PlanModePolicy;
    enableValidation?: boolean;
    enableProtocols?: boolean;
}
export declare class CommandExecutor {
    private readonly options;
    constructor(options?: CommandExecutorOptions);
    /**
     * Execute a command with all applicable protections and validations
     */
    execute<T extends BaseCommandFlow>(commandName: string, command: T, context: CommandContext): Promise<CommandResult>;
    /**
     * Execute multiple commands in sequence
     */
    executeSequence(commands: Array<{
        name: string;
        command: BaseCommandFlow;
        context: CommandContext;
    }>, continueOnError?: boolean): Promise<CommandResult[]>;
    /**
     * Check if a command is allowed to run in the current context
     */
    isCommandAllowed(commandName: string): boolean;
    /**
     * Get current execution state information
     */
    getExecutionState(): {
        inPlanMode: boolean;
        planModeSession: any;
        commandCount: number;
    };
}
