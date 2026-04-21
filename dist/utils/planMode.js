"use strict";
/**
 * Plan Mode System for Conductor
 * Implements the planning mode functionality as defined in the Conductor TOML specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanModeManager = void 0;
exports.withPlanModeProtection = withPlanModeProtection;
class PlanModeManager {
    /**
     * Activate Plan Mode with the given policy
     */
    static activate(policy, planId) {
        this.session = {
            isActive: true,
            planId: planId || `plan_${Date.now()}`,
            createdAt: new Date(),
            modifiedAt: new Date(),
            commandsExecuted: 0,
            policy
        };
        return this.session;
    }
    /**
     * Deactivate Plan Mode
     */
    static deactivate() {
        this.session = null;
    }
    /**
     * Get current Plan Mode session
     */
    static getSession() {
        return this.session;
    }
    /**
     * Check if a command is allowed in Plan Mode based on policy
     */
    static isCommandAllowed(commandName) {
        if (!this.session) {
            return true; // Not in Plan Mode, allow all commands
        }
        const policy = this.session.policy;
        // Check if command is explicitly allowed
        if (policy.allowedCommands && policy.allowedCommands.includes(commandName)) {
            return true;
        }
        // Check if command is explicitly disallowed
        if (policy.disallowedCommands && policy.disallowedCommands.includes(commandName)) {
            return false;
        }
        // Check destructive operations
        if (policy.restrictDestructiveOperations) {
            const destructiveCommands = ['revert', 'delete', 'destroy', 'rm', 'unlink'];
            if (destructiveCommands.some(dc => commandName.includes(dc))) {
                return false;
            }
        }
        // Check file system operations
        if (policy.restrictFileSystemOperations) {
            const fileOps = ['write', 'modify', 'create', 'update', 'change'];
            if (fileOps.some(op => commandName.includes(op))) {
                return false;
            }
        }
        // Default to allowing if not restricted
        return true;
    }
    /**
     * Register command execution in Plan Mode
     */
    static registerCommandExecution() {
        if (this.session) {
            this.session.commandsExecuted++;
            this.session.modifiedAt = new Date();
        }
    }
    /**
     * Check if current session exceeds execution limits
     */
    static exceedsExecutionLimits() {
        if (!this.session) {
            return false;
        }
        const policy = this.session.policy;
        if (policy.maxCommandsPerSession && this.session.commandsExecuted >= policy.maxCommandsPerSession) {
            return true;
        }
        // Check time limits
        if (policy.maxSessionDurationMinutes) {
            const elapsedMinutes = (new Date().getTime() - this.session.createdAt.getTime()) / (1000 * 60);
            if (elapsedMinutes >= policy.maxSessionDurationMinutes) {
                return true;
            }
        }
        return false;
    }
    /**
     * Validate Plan Mode permissions for a specific operation
     */
    static validatePermission(operation, _details) {
        if (!this.session) {
            return { allowed: true }; // Not in Plan Mode, allow operation
        }
        const policy = this.session.policy;
        // Apply rate limiting if configured
        if (policy.rateLimit && this.session.commandsExecuted >= policy.rateLimit) {
            return {
                allowed: false,
                reason: `Rate limit exceeded (${policy.rateLimit} commands in session)`
            };
        }
        // Apply operation-specific checks
        if (operation === 'file-write' && policy.restrictFileSystemOperations) {
            return {
                allowed: false,
                reason: 'File system write operations are restricted in Plan Mode'
            };
        }
        if (operation === 'git-operation' && policy.restrictGitOperations) {
            return {
                allowed: false,
                reason: 'Git operations are restricted in Plan Mode'
            };
        }
        if (operation === 'destructive-action' && policy.restrictDestructiveOperations) {
            return {
                allowed: false,
                reason: 'Destructive operations are restricted in Plan Mode'
            };
        }
        return { allowed: true };
    }
}
exports.PlanModeManager = PlanModeManager;
PlanModeManager.session = null;
/**
 * Middleware to wrap command execution with Plan Mode checks
 */
async function withPlanModeProtection(commandName, _context, commandFn) {
    // Check if command is allowed in Plan Mode
    if (!PlanModeManager.isCommandAllowed(commandName)) {
        return {
            success: false,
            message: `Command '${commandName}' is not permitted in Plan Mode based on current policy`
        };
    }
    // Check execution limits
    if (PlanModeManager.exceedsExecutionLimits()) {
        return {
            success: false,
            message: 'Plan Mode session has reached execution limits'
        };
    }
    // Validate specific permissions if needed
    const permissionCheck = PlanModeManager.validatePermission(commandName);
    if (!permissionCheck.allowed) {
        return {
            success: false,
            message: permissionCheck.reason || `Operation '${commandName}' not allowed in Plan Mode`
        };
    }
    // Execute the command
    const result = await commandFn();
    // Register command execution
    PlanModeManager.registerCommandExecution();
    return result;
}
