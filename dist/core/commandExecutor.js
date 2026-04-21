"use strict";
/**
 * Central Command Executor for Conductor
 * Coordinates all protocol systems and manages command execution flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandExecutor = void 0;
const planMode_1 = require("../utils/planMode");
const validation_1 = require("../utils/validation");
class CommandExecutor {
    constructor(options = {}) {
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
    async execute(commandName, command, context) {
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
            planMode_1.PlanModeManager.activate(policy);
        }
        try {
            // Wrap execution with Plan Mode protection if applicable
            return await (0, planMode_1.withPlanModeProtection)(commandName, context, async () => {
                // Perform setup validation if enabled
                if (this.options.enableValidation) {
                    const setupValidation = (0, validation_1.validateSetup)(context);
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
        }
        finally {
            // Clean up Plan Mode session if it was activated for this command
            if (context.args.includes('--plan') && planMode_1.PlanModeManager.getSession()?.planId) {
                planMode_1.PlanModeManager.deactivate();
            }
        }
    }
    /**
     * Execute multiple commands in sequence
     */
    async executeSequence(commands, continueOnError = false) {
        const results = [];
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
    isCommandAllowed(commandName) {
        // Check Plan Mode restrictions
        if (planMode_1.PlanModeManager.getSession()) {
            return planMode_1.PlanModeManager.isCommandAllowed(commandName);
        }
        return true;
    }
    /**
     * Get current execution state information
     */
    getExecutionState() {
        const planModeSession = planMode_1.PlanModeManager.getSession();
        return {
            inPlanMode: !!planModeSession,
            planModeSession: planModeSession,
            commandCount: planModeSession?.commandsExecuted || 0
        };
    }
}
exports.CommandExecutor = CommandExecutor;
