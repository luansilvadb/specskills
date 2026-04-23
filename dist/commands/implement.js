"use strict";
/**
 * Implement command - Executes tasks from a track's plan
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
exports.implementCommand = void 0;
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
const validation_1 = require("../utils/validation");
const taskExecution_1 = require("../utils/taskExecution");
const implement_helpers_1 = require("./implement.helpers");
const guidance_helpers_1 = require("./guidance.helpers");
function normalizeTaskRecord(task) {
    return {
        id: task.id || 'unknown',
        description: task.description || '',
        status: task.status || 'pending',
        type: task.type || 'development',
        priority: task.priority || 'medium',
        ...task,
    };
}
function selectCurrentTask(tasks) {
    return (tasks.find((t) => t.status === 'in_progress') ??
        tasks.find((t) => t.status === 'pending'));
}
// Helper function to handle task execution
async function executeCurrentTask(selectedTrack, tasks, conductorDir, activeSkills = []) {
    const currentTask = selectCurrentTask(tasks);
    if (!currentTask) {
        return {
            success: true,
            message: `[NO TASK] No tasks are currently in progress or pending.\n\nAll tasks completed!`
        };
    }
    // Create an instance of TaskExecutionManager
    const taskManager = new taskExecution_1.TaskExecutionManager();
    const trackDir = path.join(conductorDir, selectedTrack.folderPath);
    // Execute the current task atomically
    const taskForExecution = normalizeTaskRecord(currentTask);
    const result = await taskManager.executeTaskAtomically(taskForExecution, trackDir, activeSkills);
    return result;
}
// Helper function to handle phase verification
async function verifyPhase(selectedTrack, tasks, conductorDir, context, activeSkills = []) {
    const tasksForVerification = tasks.map(normalizeTaskRecord);
    // Check if context.data contains information about the phase to verify
    const phaseName = context.data?.phaseToVerify || 'current';
    // Create an instance of TaskExecutionManager
    const taskManager = new taskExecution_1.TaskExecutionManager();
    const trackDir = path.join(conductorDir, selectedTrack.folderPath);
    // Verify phase completion
    const result = await taskManager.verifyPhaseCompletion(tasksForVerification, phaseName, trackDir, activeSkills);
    return result;
}
function resolveTrackPlanFromArgs(context, trackArgSlice, noTrackMessage) {
    const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
    const { tracks, result: tracksResult } = (0, implement_helpers_1.readAndParseTracks)(conductorDir);
    if (tracksResult) {
        return { ok: false, result: tracksResult };
    }
    const { selectedTrack, result: selectionResult } = (0, implement_helpers_1.selectTrack)(tracks, trackArgSlice);
    if (selectionResult) {
        return { ok: false, result: selectionResult };
    }
    if (!selectedTrack) {
        return {
            ok: false,
            result: { success: false, message: noTrackMessage },
        };
    }
    const { activeSkills, tasks, result: planResult } = (0, implement_helpers_1.readAndParseTrackPlan)(path.join(conductorDir, selectedTrack.folderPath), selectedTrack, conductorDir);
    if (planResult) {
        return { ok: false, result: planResult };
    }
    return { ok: true, data: { conductorDir, selectedTrack, tasks, activeSkills } };
}
// Helper function to handle task execution
async function handleTaskExecution(context, args) {
    const resolved = resolveTrackPlanFromArgs(context, args.slice(1), 'No track selected for task execution. Please specify a track or create one with /newTrack.');
    if (!resolved.ok) {
        return resolved.result;
    }
    const { selectedTrack, tasks, conductorDir, activeSkills } = resolved.data;
    return await executeCurrentTask(selectedTrack, tasks, conductorDir, activeSkills);
}
// Helper function to handle phase verification
async function handlePhaseVerification(context, args) {
    const resolved = resolveTrackPlanFromArgs(context, args.slice(1), 'No track selected for phase verification. Please specify a track or create one with /newTrack.');
    if (!resolved.ok) {
        return resolved.result;
    }
    const { selectedTrack, tasks, conductorDir, activeSkills } = resolved.data;
    return await verifyPhase(selectedTrack, tasks, conductorDir, context, activeSkills);
}
// Helper function to validate setup
function validateSetupProcess(context) {
    const setupValidation = (0, validation_1.validateSetup)(context);
    if (!setupValidation.success) {
        return {
            success: false,
            message: `[SETUP CHECK FAILED] ${setupValidation.message}\n\n${setupValidation.errors?.join('\n')}\n\nConductor is not set up. Please run /setup.`
        };
    }
    return null;
}
// Helper function to validate track selection
function validateTrackSelectionProcess(context) {
    const trackSelectionValidation = (0, validation_1.validateTrackSelection)(context);
    if (!trackSelectionValidation.success) {
        return {
            success: false,
            message: `[TRACK SELECTION FAILED] ${trackSelectionValidation.message}\n\n${trackSelectionValidation.errors?.join('\n')}`
        };
    }
    return null;
}
// Helper function to check process integrity
function checkProcessIntegrity(conductorDir, selectedTrack) {
    // Check if spec.md exists and has been reviewed/approved
    const specPath = path.join(conductorDir, selectedTrack.folderPath, 'spec.md');
    if (!(0, fileSystem_1.fileExists)(specPath)) {
        return {
            success: false,
            message: `[BLOCKED] **Process Integrity Check Failed**\n\nO arquivo de especificação \`spec.md\` não existe para a track: **${selectedTrack.description}**\n\nO Conductor exige que:\n1. A especificação seja criada com /newTrack\n2. O plano seja revisado antes da implementação\n3. A aprovação seja dada explicitamente\n\nPor favor, execute /newTrack primeiro para criar os documentos necessários.`
        };
    }
    // Check if plan.md exists and has been reviewed
    const planPath = path.join(conductorDir, selectedTrack.folderPath, 'plan.md');
    if (!(0, fileSystem_1.fileExists)(planPath)) {
        return {
            success: false,
            message: `[BLOCKED] **Process Integrity Check Failed**\n\nO arquivo de plano \`plan.md\` não existe para a track: **${selectedTrack.description}**\n\nO Conductor exige que:\n1. O plano seja criado com /newTrack\n2. O plano seja revisado antes da implementação\n3. A aprovação seja dada explicitamente\n\nPor favor, execute /newTrack primeiro para criar os documentos necessários.`
        };
    }
    // Read the plan to check if it has tasks
    const planContent = (0, fileSystem_1.readFile)(planPath);
    if (!planContent || !planContent.includes('- [ ] ')) {
        return {
            success: false,
            message: `[BLOCKED] **Process Integrity Check Failed**\n\nO plano para **${selectedTrack.description}** não contém tarefas definidas.\n\nO Conductor exige que:\n1. As tarefas estejam definidas no plano\n2. O plano seja revisado antes da implementação\n\nPor favor, revise o arquivo \`plan.md\` e adicione as tarefas antes de prosseguir.`
        };
    }
    // Check if spec content is readable
    const specContent = (0, fileSystem_1.readFile)(specPath);
    if (!specContent) {
        return {
            success: false,
            message: `[BLOCKED] **Process Integrity Check Failed**\n\nNão foi possível ler o arquivo de especificação para **${selectedTrack.description}**.\n\nO processo do Conductor exige que a especificação esteja completa e revisada antes da implementação.`
        };
    }
    return null;
}
exports.implementCommand = {
    name: 'implement',
    description: 'Executes the tasks defined in the specified track\'s plan',
    execute: async (context, args) => {
        try {
            // Check if we're executing a specific action (task, verify-phase)
            if (args[0] === 'task') {
                return await handleTaskExecution(context, args);
            }
            else if (args[0] === 'verify-phase') {
                return await handlePhaseVerification(context, args);
            }
            // Original implementation logic
            // 1. Setup Check Protocol
            const setupValidation = validateSetupProcess(context);
            if (setupValidation) {
                return setupValidation;
            }
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
            // Validate project setup
            const validation = (0, implement_helpers_1.validateProjectSetup)(conductorDir);
            if (validation) {
                return validation;
            }
            // 2. Track Selection Validation
            const trackSelectionValidation = validateTrackSelectionProcess(context);
            if (trackSelectionValidation) {
                return trackSelectionValidation;
            }
            // Read and parse tracks
            const { tracks, result: tracksResult } = (0, implement_helpers_1.readAndParseTracks)(conductorDir);
            if (tracksResult) {
                return tracksResult;
            }
            // Select track
            const { selectedTrack, result: selectionResult } = (0, implement_helpers_1.selectTrack)(tracks, args);
            if (selectionResult) {
                return selectionResult;
            }
            if (!selectedTrack) {
                return {
                    success: false,
                    message: 'No track selected for implementation. Please specify a track or create one with /newTrack.'
                };
            }
            // Validate track structure
            const trackPath = path.join(conductorDir, selectedTrack.folderPath);
            const structureValidation = (0, implement_helpers_1.validateTrackStructure)(trackPath, selectedTrack);
            if (structureValidation) {
                return structureValidation;
            }
            // Verify process integrity before allowing implementation
            const integrityCheck = checkProcessIntegrity(conductorDir, selectedTrack);
            if (integrityCheck) {
                return integrityCheck;
            }
            // Read and parse track plan
            const { activeSkills, tasks, result: planResult } = (0, implement_helpers_1.readAndParseTrackPlan)(trackPath, selectedTrack, conductorDir);
            if (planResult) {
                return planResult;
            }
            const { completed, result: completionResult } = (0, implement_helpers_1.handleTrackCompletion)(selectedTrack, tasks);
            if (completed && completionResult) {
                return completionResult;
            }
            // Generate implementation guidance
            const message = (0, guidance_helpers_1.generateImplementationGuidance)(selectedTrack, tasks, activeSkills, conductorDir, trackPath);
            // Update track status in main index.md to [~] (in progress)
            await (0, implement_helpers_1.updateTrackStatusInIndex)(conductorDir, selectedTrack.description, 'in_progress');
            return {
                success: true,
                message,
                data: {
                    track: selectedTrack,
                    tasks: tasks,
                    pendingCount: tasks.reduce((count, t) => (t.status === 'pending' ? count + 1 : count), 0),
                    currentTask: tasks.find(t => t.status === 'in_progress')?.description,
                },
            };
        }
        catch (error) {
            return (0, validation_1.handleOperationFailure)('implement', error);
        }
    },
};
