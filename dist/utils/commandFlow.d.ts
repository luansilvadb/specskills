/**
 * Command Flow Control System
 * Manages the execution flow of commands with support for interactive questions and validations
 */
import type { CommandContext, CommandResult, InteractiveQuestion } from '../types';
export interface CommandFlowState {
    context: CommandContext;
    result: CommandResult;
    userResponses?: Record<string, any>;
}
export declare abstract class BaseCommandFlow {
    /**
     * Execute command with potential interactive questions
     */
    execute(context: CommandContext): Promise<CommandResult>;
    /**
     * Abstract method to be implemented by subclasses
     */
    protected abstract executeCommand(context: CommandContext): Promise<CommandResult>;
}
/**
 * Specialized flow for commands that may require user confirmation
 */
export declare class ConfirmationCommandFlow extends BaseCommandFlow {
    private readonly confirmMessage?;
    constructor(confirmMessage?: string | undefined);
    protected getConfirmMessage(): string | undefined;
    protected executeCommand(_context: CommandContext): Promise<CommandResult>;
}
/**
 * Utility function to create a confirmation question
 */
export declare function createConfirmationQuestion(header: string, question: string): InteractiveQuestion;
/**
 * Utility function to create a choice question
 */
export declare function createChoiceQuestion(header: string, question: string, options: {
    label: string;
    description: string;
}[], multiSelect?: boolean): InteractiveQuestion;
/**
 * Utility function to create a text input question
 */
export declare function createTextQuestion(header: string, question: string, placeholder?: string, minLength?: number, maxLength?: number): InteractiveQuestion;
