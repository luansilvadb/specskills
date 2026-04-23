/**
 * Implement command - Executes tasks from a track's plan
 */

import * as path from 'path';
import type { CommandContext, CommandResult, SlashCommand } from '../types';
import {
  fileExists,
  readFile,
  resolveConductorDir,
} from '../utils/fileSystem';
import { validateSetup, validateTrackSelection, handleOperationFailure } from '../utils/validation';
import { TaskExecutionManager } from '../utils/taskExecution';
import {
  validateProjectSetup,
  readAndParseTracks,
  selectTrack,
  validateTrackStructure,
  readAndParseTrackPlan,
  updateTrackStatusInIndex,
  handleTrackCompletion,
} from './implement.helpers';
import { generateImplementationGuidance } from './guidance.helpers';

function normalizeTaskRecord(task: any): any {
  return {
    id: task.id || 'unknown',
    description: task.description || '',
    status: task.status || 'pending',
    type: task.type || 'development',
    priority: task.priority || 'medium',
    ...task,
  };
}

function selectCurrentTask(tasks: any[]): any {
  return (
    tasks.find((t: any) => t.status === 'in_progress') ??
    tasks.find((t: any) => t.status === 'pending')
  );
}

// Helper function to handle task execution
async function executeCurrentTask(selectedTrack: any, tasks: any[], conductorDir: string, activeSkills: any[] = []): Promise<CommandResult> {
  const currentTask = selectCurrentTask(tasks);

  if (!currentTask) {
    return {
      success: true,
      message: `[NO TASK] No tasks are currently in progress or pending.\n\nAll tasks completed!`
    };
  }

  // Create an instance of TaskExecutionManager
  const taskManager = new TaskExecutionManager();
  const trackDir = path.join(conductorDir, selectedTrack.folderPath);

  // Execute the current task atomically
  const taskForExecution = normalizeTaskRecord(currentTask);
  const result = await taskManager.executeTaskAtomically(taskForExecution, trackDir, activeSkills);

  return result;
}

// Helper function to handle phase verification
async function verifyPhase(selectedTrack: any, tasks: any[], conductorDir: string, context: CommandContext, activeSkills: any[] = []): Promise<CommandResult> {
  const tasksForVerification = tasks.map(normalizeTaskRecord);

  // Check if context.data contains information about the phase to verify
  const phaseName = context.data?.phaseToVerify || 'current';

  // Create an instance of TaskExecutionManager
  const taskManager = new TaskExecutionManager();
  const trackDir = path.join(conductorDir, selectedTrack.folderPath);

  // Verify phase completion
  const result = await taskManager.verifyPhaseCompletion(tasksForVerification, phaseName, trackDir, activeSkills);

  return result;
}

type ImplementAction = 'task' | 'verify-phase';

type ResolvedTrackPlan = {
  conductorDir: string;
  selectedTrack: any;
  tasks: any[];
  activeSkills: any[];
};

function resolveTrackPlanFromArgs(
  context: CommandContext,
  trackArgSlice: string[],
  noTrackMessage: string
): { ok: true; data: ResolvedTrackPlan } | { ok: false; result: CommandResult } {
  const conductorDir = resolveConductorDir(context.projectRoot);
  const { tracks, result: tracksResult } = readAndParseTracks(conductorDir);
  if (tracksResult) {
    return { ok: false, result: tracksResult };
  }

  const { selectedTrack, result: selectionResult } = selectTrack(tracks, trackArgSlice);
  if (selectionResult) {
    return { ok: false, result: selectionResult };
  }

  if (!selectedTrack) {
    return {
      ok: false,
      result: { success: false, message: noTrackMessage },
    };
  }

  const { activeSkills, tasks, result: planResult } = readAndParseTrackPlan(
    path.join(conductorDir, selectedTrack.folderPath),
    selectedTrack,
    conductorDir
  );
  if (planResult) {
    return { ok: false, result: planResult };
  }

  return { ok: true, data: { conductorDir, selectedTrack, tasks, activeSkills } };
}

async function executeAction(
  action: ImplementAction,
  context: CommandContext,
  args: string[]
): Promise<CommandResult> {
  const handler =
    action === 'task' ? handleTaskExecution : handlePhaseVerification;
  return await handler(context, args);
}

function resolveAction(args: string[]): ImplementAction | null {
  if (args[0] === 'task' || args[0] === 'verify-phase') {
    return args[0];
  }
  return null;
}

function buildImplementationData(tasks: any[], selectedTrack: any) {
  const currentTask = tasks.find((t) => t.status === 'in_progress')?.description;
  const pendingCount = tasks.reduce(
    (count, t) => (t.status === 'pending' ? count + 1 : count),
    0
  );

  return {
    track: selectedTrack as unknown as Record<string, unknown>,
    tasks: tasks as Record<string, unknown>[],
    pendingCount,
    currentTask,
  };
}

async function handleTaskExecution(context: CommandContext, args: string[]): Promise<CommandResult> {
  const resolved = resolveTrackPlanFromArgs(
    context,
    args.slice(1),
    'No track selected for task execution. Please specify a track or create one with /newTrack.'
  );
  if (!resolved.ok) {
    return resolved.result;
  }
  const { selectedTrack, tasks, conductorDir, activeSkills } = resolved.data;
  return await executeCurrentTask(selectedTrack, tasks, conductorDir, activeSkills);
}

async function handlePhaseVerification(context: CommandContext, args: string[]): Promise<CommandResult> {
  const resolved = resolveTrackPlanFromArgs(
    context,
    args.slice(1),
    'No track selected for phase verification. Please specify a track or create one with /newTrack.'
  );
  if (!resolved.ok) {
    return resolved.result;
  }
  const { selectedTrack, tasks, conductorDir, activeSkills } = resolved.data;
  return await verifyPhase(selectedTrack, tasks, conductorDir, context, activeSkills);
}

// Helper function to validate setup
function validateSetupProcess(context: CommandContext): CommandResult | null {
  const setupValidation = validateSetup(context);
  if (!setupValidation.success) {
    return {
      success: false,
      message: `[SETUP CHECK FAILED] ${setupValidation.message}\n\n${setupValidation.errors?.join('\n')}\n\nConductor is not set up. Please run /setup.`
    };
  }
  return null;
}

// Helper function to validate track selection
function validateTrackSelectionProcess(context: CommandContext): CommandResult | null {
  const trackSelectionValidation = validateTrackSelection(context);
  if (!trackSelectionValidation.success) {
    return {
      success: false,
      message: `[TRACK SELECTION FAILED] ${trackSelectionValidation.message}\n\n${trackSelectionValidation.errors?.join('\n')}`
    };
  }
  return null;
}

// Helper function to check process integrity
function checkProcessIntegrity(conductorDir: string, selectedTrack: any): CommandResult | null {
  // Check if spec.md exists and has been reviewed/approved
  const specPath = path.join(conductorDir, selectedTrack.folderPath, 'spec.md');
  if (!fileExists(specPath)) {
    return {
      success: false,
      message: `[BLOCKED] **Process Integrity Check Failed**\n\nO arquivo de especificação \`spec.md\` não existe para a track: **${selectedTrack.description}**\n\nO Conductor exige que:\n1. A especificação seja criada com /newTrack\n2. O plano seja revisado antes da implementação\n3. A aprovação seja dada explicitamente\n\nPor favor, execute /newTrack primeiro para criar os documentos necessários.`
    };
  }

  // Check if plan.md exists and has been reviewed
  const planPath = path.join(conductorDir, selectedTrack.folderPath, 'plan.md');
  if (!fileExists(planPath)) {
    return {
      success: false,
      message: `[BLOCKED] **Process Integrity Check Failed**\n\nO arquivo de plano \`plan.md\` não existe para a track: **${selectedTrack.description}**\n\nO Conductor exige que:\n1. O plano seja criado com /newTrack\n2. O plano seja revisado antes da implementação\n3. A aprovação seja dada explicitamente\n\nPor favor, execute /newTrack primeiro para criar os documentos necessários.`
    };
  }

  // Read the plan to check if it has tasks
  const planContent = readFile(planPath);
  if (!planContent || !planContent.includes('- [ ] ')) {
    return {
      success: false,
      message: `[BLOCKED] **Process Integrity Check Failed**\n\nO plano para **${selectedTrack.description}** não contém tarefas definidas.\n\nO Conductor exige que:\n1. As tarefas estejam definidas no plano\n2. O plano seja revisado antes da implementação\n\nPor favor, revise o arquivo \`plan.md\` e adicione as tarefas antes de prosseguir.`
    };
  }

  // Check if spec content is readable
  const specContent = readFile(specPath);
  if (!specContent) {
    return {
      success: false,
      message: `[BLOCKED] **Process Integrity Check Failed**\n\nNão foi possível ler o arquivo de especificação para **${selectedTrack.description}**.\n\nO processo do Conductor exige que a especificação esteja completa e revisada antes da implementação.`
    };
  }

  return null;
}


export const implementCommand: SlashCommand = {
  name: 'implement',
  description: 'Executes the tasks defined in the specified track\'s plan',
  execute: async (context: CommandContext, args: string[]): Promise<CommandResult> => {
    try {
      const action = resolveAction(args);
      if (action) {
        return await executeAction(action, context, args);
      }

      // Original implementation logic
      // 1. Setup Check Protocol
      const setupValidation = validateSetupProcess(context);
      if (setupValidation) {
        return setupValidation;
      }

      const conductorDir = resolveConductorDir(context.projectRoot);

      // Validate project setup
      const validation = validateProjectSetup(conductorDir);
      if (validation) {
        return validation;
      }

      // 2. Track Selection Validation
      const trackSelectionValidation = validateTrackSelectionProcess(context);
      if (trackSelectionValidation) {
        return trackSelectionValidation;
      }

      // Read and parse tracks
      const { tracks, result: tracksResult } = readAndParseTracks(conductorDir);
      if (tracksResult) {
        return tracksResult;
      }

      // Select track
      const { selectedTrack, result: selectionResult } = selectTrack(tracks, args);
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
      const structureValidation = validateTrackStructure(trackPath, selectedTrack);
      if (structureValidation) {
        return structureValidation;
      }

      // Verify process integrity before allowing implementation
      const integrityCheck = checkProcessIntegrity(conductorDir, selectedTrack);
      if (integrityCheck) {
        return integrityCheck;
      }

      // Read and parse track plan
      const { activeSkills, tasks, result: planResult } = readAndParseTrackPlan(
        trackPath,
        selectedTrack,
        conductorDir
      );
      if (planResult) {
        return planResult;
      }

      const { completed, result: completionResult } = handleTrackCompletion(selectedTrack, tasks);
      if (completed && completionResult) {
        return completionResult;
      }

      // Generate implementation guidance
      const message = generateImplementationGuidance(selectedTrack, tasks, activeSkills, conductorDir, trackPath);

      // Update track status in main index.md to [~] (in progress)
      await updateTrackStatusInIndex(conductorDir, selectedTrack.description, 'in_progress');

      return {
        success: true,
        message,
        data: buildImplementationData(tasks, selectedTrack),
      };
    } catch (error) {
      return handleOperationFailure('implement', error);
    }
  },
};
