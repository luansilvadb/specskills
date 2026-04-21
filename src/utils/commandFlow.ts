/**
 * Command Flow Control System
 * Manages the execution flow of commands with support for interactive questions and validations
 */

import type { CommandContext, CommandResult, InteractiveQuestion } from '../types';
import { processInteractiveQuestions, validateUserResponse, transformQuestionResult } from './interaction';

export interface CommandFlowState {
  context: CommandContext;
  result: CommandResult;
  userResponses?: Record<string, any>;
}

export abstract class BaseCommandFlow {
  /**
   * Execute command with potential interactive questions
   */
  async execute(context: CommandContext): Promise<CommandResult> {
    try {
      // Execute the primary command logic
      const result = await this.executeCommand(context);

      // If the command result includes questions, process them
      if (result.questions && result.questions.length > 0) {
        const responses = await processInteractiveQuestions(result.questions);

        // Validate responses
        for (let i = 0; i < result.questions.length; i++) {
          const question = result.questions[i];
          const response = responses[i].answer;

          const validation = validateUserResponse(question, response);
          if (!validation.isValid) {
            return {
              success: false,
              message: `Validation error for question "${question.header}": ${validation.error}`
            };
          }
        }

        // Transform and store responses
        const transformedResponses: Record<string, any> = {};
        for (let i = 0; i < result.questions.length; i++) {
          const question = result.questions[i];
          const response = responses[i].answer;

          transformedResponses[question.header] = transformQuestionResult(question, response);
        }

        // Update result with processed responses
        return {
          ...result,
          data: {
            ...result.data,
            userResponses: transformedResponses
          }
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: `Command execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Abstract method to be implemented by subclasses
   */
  protected abstract executeCommand(context: CommandContext): Promise<CommandResult>;
}

/**
 * Specialized flow for commands that may require user confirmation
 */
export class ConfirmationCommandFlow extends BaseCommandFlow {
  constructor(private readonly confirmMessage?: string) {
    super();
  }

  protected getConfirmMessage(): string | undefined {
    return this.confirmMessage;
  }

  protected async executeCommand(_context: CommandContext): Promise<CommandResult> {
    // This would be overridden by specific command implementations
    throw new Error('executeCommand must be implemented by subclass');
  }
}

/**
 * Utility function to create a confirmation question
 */
export function createConfirmationQuestion(header: string, question: string): InteractiveQuestion {
  return {
    header,
    question,
    type: 'yesno',
    required: true
  };
}

/**
 * Utility function to create a choice question
 */
export function createChoiceQuestion(
  header: string,
  question: string,
  options: { label: string; description: string }[],
  multiSelect = false
): InteractiveQuestion {
  return {
    header,
    question,
    type: 'choice',
    multiSelect,
    options,
    required: true
  };
}

/**
 * Utility function to create a text input question
 */
export function createTextQuestion(
  header: string,
  question: string,
  placeholder?: string,
  minLength?: number,
  maxLength?: number
): InteractiveQuestion {
  return {
    header,
    question,
    type: 'text',
    placeholder,
    minLength,
    maxLength,
    required: true
  };
}