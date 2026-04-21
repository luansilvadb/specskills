/**
 * Central Command Executor for Conductor
 * Coordinates all protocol systems and manages command execution flow
 */

import type { CommandContext, CommandResult, PlanModePolicy } from '../types';
import { PlanModeManager, withPlanModeProtection } from '../utils/planMode';
import { validateSetup } from '../utils/validation';
import { BaseCommandFlow } from '../utils/commandFlow';

export interface CommandExecutorOptions {
  enablePlanMode?: boolean;
  planModePolicy?: PlanModePolicy;
  enableValidation?: boolean;
  enableProtocols?: boolean;
}

export class CommandExecutor {
  private readonly options: CommandExecutorOptions;

  constructor(options: CommandExecutorOptions = {}) {
    this.options = {
      enablePlanMode: true,
      enableValidation: true,
      enableProtocols: true,
      ...options
    };
  }

  /**
   * Execute a command with all applicable protections and validations
   */
  async execute<T extends BaseCommandFlow>(
    commandName: string,
    command: T,
    context: CommandContext
  ): Promise<CommandResult> {
    // Activate Plan Mode if enabled and requested
    if (this.options.enablePlanMode && context.args.includes('--plan')) {
      const policy = this.options.planModePolicy || {
        restrictDestructiveOperations: true,
        restrictFileSystemOperations: true,
        restrictGitOperations: true,
        maxCommandsPerSession: 50,
        maxSessionDurationMinutes: 60,
        rateLimit: 10
      };

      PlanModeManager.activate(policy);
    }

    try {
      // Wrap execution with Plan Mode protection if applicable
      return await withPlanModeProtection(commandName, context, async () => {
        // Perform setup validation if enabled
        if (this.options.enableValidation) {
          const setupValidation = validateSetup(context);
          if (!setupValidation.success) {
            return {
              success: false,
              message: `[SETUP CHECK FAILED] ${setupValidation.message}\n\n${setupValidation.errors?.join('\n') || ''}`
            };
          }
        }

        // Execute the command through the flow system
        return await command.execute(context);
      });
    } finally {
      // Clean up Plan Mode session if it was activated for this command
      if (context.args.includes('--plan') && PlanModeManager.getSession()?.planId) {
        PlanModeManager.deactivate();
      }
    }
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeSequence(
    commands: Array<{ name: string; command: BaseCommandFlow; context: CommandContext }>,
    continueOnError = false
  ): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const { name, command, context } of commands) {
      const result = await this.execute(name, command, context);

      results.push(result);

      // If continueOnError is false and this command failed, stop execution
      if (!continueOnError && !result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Check if a command is allowed to run in the current context
   */
  isCommandAllowed(commandName: string): boolean {
    // Check Plan Mode restrictions
    if (PlanModeManager.getSession()) {
      return PlanModeManager.isCommandAllowed(commandName);
    }

    return true;
  }

  /**
   * Get current execution state information
   */
  getExecutionState(): {
    inPlanMode: boolean;
    planModeSession: any;
    commandCount: number;
  } {
    const planModeSession = PlanModeManager.getSession();

    return {
      inPlanMode: !!planModeSession,
      planModeSession: planModeSession,
      commandCount: planModeSession?.commandsExecuted || 0
    };
  }
}