"use strict";
/**
 * Workflow System for Conductor
 * Implements the workflow protocol as defined in the Conductor TOML specifications
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowManager = void 0;
const path = __importStar(require("path"));
const fileSystem_1 = require("./fileSystem");
class WorkflowManager {
    /**
     * Load workflow configuration from file
     */
    static loadWorkflow(context) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        const workflowPath = path.join(conductorDir, 'workflow.md');
        if (!(0, fileSystem_1.fileExists)(workflowPath)) {
            return null;
        }
        const content = (0, fileSystem_1.readFile)(workflowPath);
        if (!content) {
            return null;
        }
        // Parse workflow from markdown content
        return this.parseWorkflow(content);
    }
    /**
     * Parse workflow from markdown content
     */
    static parseWorkflow(content) {
        // Extract workflow name and description
        const nameMatch = content.match(/^#\s+(.+)$/m);
        const descriptionMatch = content.match(/^##\s+Description\r?\n\r?([^#]+)/m);
        const name = nameMatch ? nameMatch[1] : 'Default Workflow';
        const description = descriptionMatch ? descriptionMatch[1].trim() : 'Default Conductor workflow';
        // Extract steps from the content
        const steps = [];
        // Look for step definitions in the format:
        // ### Step 1: Title
        // Description of the step
        const stepMatches = content.matchAll(/###\s+(Step\s+\d+:.*?)\r?\n\r?([\s\S]*?)(?=\r?\n###|\r?\n##|$)/g);
        for (const match of stepMatches) {
            const title = match[1];
            const description = match[2].trim();
            // Check if this step is marked as turbo
            const turbo = description.toLowerCase().includes('turbo') ||
                description.toLowerCase().includes('fast') ||
                description.toLowerCase().includes('quick');
            steps.push({
                id: this.generateStepId(title),
                description: description,
                turbo
            });
        }
        return {
            name,
            description,
            steps
        };
    }
    /**
     * Generate a step ID from its title
     */
    static generateStepId(title) {
        return title
            .toLowerCase()
            .replace(/step\s+(\d+):?\s*/, 'step-$1-')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    /**
     * Execute workflow starting from the current state
     */
    static async executeWorkflow(context, workflow, initialState) {
        try {
            const state = {
                currentStep: initialState?.currentStep || 0,
                completedSteps: initialState?.completedSteps || [],
                startTime: initialState?.startTime || new Date(),
                lastUpdated: new Date(),
                metadata: initialState?.metadata || {}
            };
            // Execute each step in sequence
            for (let i = state.currentStep; i < workflow.steps.length; i++) {
                const step = workflow.steps[i];
                // Skip turbo steps if in turbo mode and the step supports it
                if (context.args.includes('--turbo') && step.turbo) {
                    state.completedSteps.push(step.id);
                    continue;
                }
                // Execute the step
                const stepResult = await this.executeStep(context, step, state);
                if (!stepResult.success) {
                    return {
                        success: false,
                        message: `Workflow failed at step ${i + 1}: ${step.id}. ${stepResult.message}`
                    };
                }
                // Mark step as completed
                state.completedSteps.push(step.id);
                state.currentStep = i + 1;
                state.lastUpdated = new Date();
                // Allow for interruption between steps
                await this.checkInterruption();
            }
            return {
                success: true,
                message: `Workflow completed successfully. ${state.completedSteps.length} steps executed.`,
                data: {
                    completedSteps: state.completedSteps,
                    totalTime: new Date().getTime() - state.startTime.getTime()
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Execute a single workflow step
     */
    static async executeStep(_context, step, _state) {
        // In a real implementation, this would execute specific step logic
        // For now, we'll simulate execution
        // Simulate some work
        await this.delay(100);
        return {
            success: true,
            message: `Step completed: ${step.description.substring(0, 50)}...`
        };
    }
    /**
     * Check if execution should be interrupted
     */
    static async checkInterruption() {
        // This could check for cancellation tokens or user interruptions
        // For now, just return immediately
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    /**
     * Get workflow checkpoint (current execution state)
     */
    static getCheckpoint(state) {
        const progress = Math.round((state.currentStep / state.metadata.totalSteps) * 100) || 0;
        return `Workflow Checkpoint:
    Current Step: ${state.currentStep}
    Progress: ${progress}%
    Started: ${state.startTime.toISOString()}
    Last Updated: ${state.lastUpdated.toISOString()}`;
    }
    /**
     * Create a delay for simulation purposes
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Validate workflow configuration
     */
    static validateWorkflow(workflow) {
        const errors = [];
        if (!workflow.name || workflow.name.trim() === '') {
            errors.push('Workflow must have a name');
        }
        if (!workflow.description || workflow.description.trim() === '') {
            errors.push('Workflow must have a description');
        }
        if (!workflow.steps || workflow.steps.length === 0) {
            errors.push('Workflow must have at least one step');
        }
        else {
            workflow.steps.forEach((step, index) => {
                if (!step.id || step.id.trim() === '') {
                    errors.push(`Step ${index + 1} must have an ID`);
                }
                if (!step.description || step.description.trim() === '') {
                    errors.push(`Step ${index + 1} must have a description`);
                }
            });
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.WorkflowManager = WorkflowManager;
