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
  updateTrackStatusInIndex
} from './implement.helpers';

// Helper function to generate implementation guidance message
function generateImplementationGuidance(selectedTrack: any, tasks: any[], activeSkills: any[], conductorDir: string, trackDir: string): string {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const currentTask = tasks.find(t => t.status === 'in_progress');

  let message = generateInitialGuidanceMessage(selectedTrack);

  if (activeSkills.length > 0) {
    message += `[ACTIVE SKILLS] ${activeSkills.map(s => `[${s.title}]`).join(' ')}\n`;
  }

  message += `\n---\n\n`;

  message += generateTaskStatusSection(currentTask, pendingTasks);

  message += generateContextInfo(conductorDir, trackDir, activeSkills);

  message += generateWorkflowInstructions();

  return message;
}

/**
 * Generate the initial guidance message
 */
function generateInitialGuidanceMessage(selectedTrack: any): string {
  let message = `> [!IMPORTANT]\n> **STOP: LENDO PROTOCOLO DE EXECUÇÃO!**\n> \n> Você está implementando: **${selectedTrack.description}**\n> \n> **DIRETIVA DO CONDUCTOR:**\n> 1. Leia os protocolos das skills ativas abaixo.\n> 2. Siga as instruções da tarefa atual antes de prosseguir.\n> 3. NÃO inicie o trabalho sem confirmar o "Mindset" da track.\n> 4. Execute tarefas individualmente seguindo o ciclo TDD (Red, Green, Refactor).\n> 5. Marque cada tarefa como concluída antes de passar para a próxima.\n\n`;
  message += `[ANALYSIS] Resolve: Track\n`;

  return message;
}

/**
 * Generate the task status section
 */
function generateTaskStatusSection(currentTask: any, pendingTasks: any[]): string {
  let message = '';

  if (currentTask) {
    message += `[PROGRESS] **Current Task (In Progress)**\n`;
    message += `> ${currentTask.description}\n\n`;
  }

  if (pendingTasks.length > 0) {
    message += `[PENDING] **Next Pending Tasks**\n`;
    for (const task of pendingTasks.slice(0, 3)) {
      message += `- [ ] ${task.description}\n`;
    }
    message += '\n';
  }

  return message;
}

/**
 * Generate context information
 */
function generateContextInfo(conductorDir: string, trackDir: string, activeSkills: any[]): string {
  let contextInfo = '';

  // Add spec info if available
  contextInfo += generateSpecInfo(trackDir);

  // Add project context info
  contextInfo += generateProjectContextInfo(conductorDir);

  // Add protocols info if active skills exist
  if (activeSkills.length > 0) {
    contextInfo += generateProtocolsInfo(activeSkills);
  }

  return contextInfo;
}

/**
 * Generate specification information
 */
function generateSpecInfo(trackDir: string): string {
  const specPath = path.join(trackDir, 'spec.md');
  let contextInfo = '';

  if (fileExists(specPath)) {
    const specContent = readFile(specPath);
    if (specContent) {
      contextInfo += '\n[SPECIFICATION] **Track Specification**\n';
      contextInfo += `Available at: \`${specPath}\`\n`;
    }
  }

  return contextInfo;
}

/**
 * Generate project context information
 */
function generateProjectContextInfo(conductorDir: string): string {
  let contextInfo = '';

  const productContent = readFile(path.join(conductorDir, 'product.md'));
  const techStackContent = readFile(path.join(conductorDir, 'tech-stack.md'));
  const workflowContent = readFile(path.join(conductorDir, 'workflow.md'));

  if (productContent || techStackContent || workflowContent) {
    contextInfo += '\n[CONTEXT] **Project Context**\n';
    contextInfo += '> [!NOTE]\n';

    if (productContent) {
      const goalMatch = productContent.match(/## (?:Project Goal|Overview)\r?\n\r?([\s\S]+?)(?:\r?\n\r?##|$)/);
      if (goalMatch) contextInfo += `> **Goal:** ${goalMatch[1].trim().split(/\r?\n/)[0]}\n`;
      contextInfo += '> - [x] Product definition loaded\n';
    }

    if (techStackContent) {
      const languageMatch = techStackContent.match(/- Primary:\s*(.+)/);
      if (languageMatch) contextInfo += `> **Tech stack:** ${languageMatch[1].trim()}\n`;
      contextInfo += '> - [x] Tech stack guidelines loaded\n';
    }

    if (workflowContent) contextInfo += '> - [x] Workflow process loaded\n';
  }

  return contextInfo;
}

/**
 * Generate protocols information
 */
function generateProtocolsInfo(activeSkills: any[]): string {
  let protocolsInfo = `\n> [!IMPORTANT]\n> **PRE-FLIGHT PROTOCOLS (Protocolos Ativos):**\n`;
  protocolsInfo += `> Siga rigorosamente estas diretivas de resiliência e arquitetura nesta etapa:\n>\n`;

  for (const skill of activeSkills) {
    protocolsInfo += `> **[${skill.title}]**:\n`;
    if (skill.purpose) {
      protocolsInfo += `> - *Foco:* ${skill.purpose}\n`;
    }

    if (skill.protocol) {
      protocolsInfo += `> - *Diretiva:* ${skill.protocol.replace(/\n/g, '\n>   ')}\n`;
    } else {
      protocolsInfo += `> - *Diretiva:* Protocolo padrão ativo nos artefatos.\n`;
    }
    protocolsInfo += `>\n`;
  }

  return protocolsInfo;
}

/**
 * Generate workflow instructions
 */
function generateWorkflowInstructions(): string {
  let message = `\n---\n\n> [!NOTE]\n`;
  message += `> **Atomic Task Execution Workflow**\n`;
  message += '> 1. Focus on ONE task at a time\n';
  message += '> 2. Execute TDD cycle: Red (write failing test) → Green (make it pass) → Refactor (optimize)\n';
  message += '> 3. Mark task complete: `[~]` → `[x]` in plan.md\n';
  message += '> 4. Verify task completion before moving to next\n';
  message += '> 5. At phase boundary: Generate manual test plan and get confirmation\n';

  return message;
}

// Helper function to select current task
function selectCurrentTask(tasks: any[]): any {
  let currentTask: any = tasks.find((t: any) => t.status === 'in_progress');

  if (!currentTask) {
    // If no current task, select the first pending task
    const pendingTask: any = tasks.find((t: any) => t.status === 'pending');
    if (pendingTask) {
      currentTask = pendingTask;
    }
  }

  return currentTask;
}

// Helper function to create task for execution
function createTaskForExecution(task: any): any {
  return {
    id: task.id || 'unknown',
    description: task.description || '',
    status: task.status || 'pending',
    type: task.type || 'development',
    priority: task.priority || 'medium',
    ...task
  };
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
  const taskForExecution = createTaskForExecution(currentTask);
  const result = await taskManager.executeTaskAtomically(taskForExecution, trackDir, activeSkills);

  return result;
}

// Helper function to create tasks for verification
function createTasksForVerification(tasks: any[]): any[] {
  return tasks.map((t: any) => ({
    id: t.id || 'unknown',
    description: t.description || '',
    status: t.status || 'pending',
    type: t.type || 'development',
    priority: t.priority || 'medium',
    ...t
  }));
}

// Helper function to handle phase verification
async function verifyPhase(selectedTrack: any, tasks: any[], conductorDir: string, context: CommandContext, activeSkills: any[] = []): Promise<CommandResult> {
  const tasksForVerification = createTasksForVerification(tasks);

  // Check if context.data contains information about the phase to verify
  const phaseName = context.data?.phaseToVerify || 'current';

  // Create an instance of TaskExecutionManager
  const taskManager = new TaskExecutionManager();
  const trackDir = path.join(conductorDir, selectedTrack.folderPath);

  // Verify phase completion
  const result = await taskManager.verifyPhaseCompletion(tasksForVerification, phaseName, trackDir, activeSkills);

  return result;
}

// Helper function to handle task execution
async function handleTaskExecution(context: CommandContext, args: string[]): Promise<CommandResult> {
  const conductorDir = resolveConductorDir(context.projectRoot);

  // Read and parse tracks
  const { tracks, result: tracksResult } = readAndParseTracks(conductorDir);
  if (tracksResult) {
    return tracksResult;
  }

  // Select track
  const { selectedTrack, result: selectionResult } = selectTrack(tracks, args.slice(1)); // Skip 'task' argument
  if (selectionResult) {
    return selectionResult;
  }

  if (!selectedTrack) {
    return {
      success: false,
      message: 'No track selected for task execution. Please specify a track or create one with /newTrack.'
    };
  }

  // Read and parse track plan
  const { planContent: __, activeSkills, tasks, result: planResult } = readAndParseTrackPlan(
    path.join(conductorDir, selectedTrack.folderPath),
    selectedTrack,
    conductorDir
  );
  if (planResult) {
    return planResult;
  }

  // Execute the current task
  return await executeCurrentTask(selectedTrack, tasks, conductorDir, activeSkills);
}

// Helper function to handle phase verification
async function handlePhaseVerification(context: CommandContext, args: string[]): Promise<CommandResult> {
  const conductorDir = resolveConductorDir(context.projectRoot);

  // Read and parse tracks
  const { tracks, result: tracksResult } = readAndParseTracks(conductorDir);
  if (tracksResult) {
    return tracksResult;
  }

  // Select track
  const { selectedTrack, result: selectionResult } = selectTrack(tracks, args.slice(1)); // Skip 'verify-phase' argument
  if (selectionResult) {
    return selectionResult;
  }

  if (!selectedTrack) {
    return {
      success: false,
      message: 'No track selected for phase verification. Please specify a track or create one with /newTrack.'
    };
  }

  // Read and parse track plan
  const { planContent: __, activeSkills, tasks, result: planResult } = readAndParseTrackPlan(
    path.join(conductorDir, selectedTrack.folderPath),
    selectedTrack,
    conductorDir
  );
  if (planResult) {
    return planResult;
  }

  // Verify the phase
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

// Helper function to validate track structure
function validateTrackStructureProcess(trackPath: string, selectedTrack: any): CommandResult | null {
  return validateTrackStructure(trackPath, selectedTrack);
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
      // Check if we're executing a specific action (task, verify-phase)
      if (args[0] === 'task') {
        return await handleTaskExecution(context, args);
      } else if (args[0] === 'verify-phase') {
        return await handlePhaseVerification(context, args);
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
      const structureValidation = validateTrackStructureProcess(trackPath, selectedTrack);
      if (structureValidation) {
        return structureValidation;
      }

      // Verify process integrity before allowing implementation
      const integrityCheck = checkProcessIntegrity(conductorDir, selectedTrack);
      if (integrityCheck) {
        return integrityCheck;
      }

      // Read and parse track plan
      const { planContent: __, activeSkills, tasks, result: planResult } = readAndParseTrackPlan(
        trackPath,
        selectedTrack,
        conductorDir
      );
      if (planResult) {
        return planResult;
      }

      // Handle track completion if applicable
      const { completed, result: completionResult } = (() => {
        const pendingTasks = tasks.filter(t => t.status === 'pending');
        const currentTask = tasks.find(t => t.status === 'in_progress');

        // Completion Logic (Protocol 4.0 & 5.0)
        if (pendingTasks.length === 0 && !currentTask) {
          return {
            completed: true,
            result: {
              success: true,
              message: `[SUCCESS] **Track Implementation Complete**\n\nI will now initiate the **Synchronization Protocol (4.0)** and **Cleanup (5.0)**.\n\n**O Agente deve agora:**\n1. Comparar as alterações implementadas com o \`spec.md\`.\n2. Propor atualizações para \`product.md\`, \`tech-stack.md\` e \`product-guidelines.md\`.\n3. Após aprovação, atualizar o \`index.md\` e decidir o destino desta track.`,
              questions: [
                {
                  header: "Sync Docs",
                  question: "Should I analyze the specification and propose updates to `product.md` and `tech-stack.md`?",
                  type: "yesno" as const
                },
                {
                  header: "Cleanup",
                  question: "What should I do with this track folder?",
                  type: "choice" as const,
                  options: [
                    { label: "Archive", description: "Move to conductor/archive/" },
                    { label: "Delete", description: "Permanently remove track" },
                    { label: "Keep", description: "Leave it in the tracks list" }
                  ]
                }
              ],
              data: {
                trackId: path.basename(selectedTrack.folderPath),
                canSync: true,
                protocol: '4.0',
                syncAction: 'analyze_docs'
              }
            }
          };
        }

        return { completed: false, result: null };
      })();
      if (completed) {
        return completionResult!;
      }

      // Generate implementation guidance
      const message = generateImplementationGuidance(selectedTrack, tasks, activeSkills, conductorDir, trackPath);

      // Update track status in main index.md to [~] (in progress)
      await updateTrackStatusInIndex(conductorDir, selectedTrack.description, 'in_progress');

      return {
        success: true,
        message,
        data: {
          track: selectedTrack as unknown as Record<string, unknown>,
          tasks: tasks as Record<string, unknown>[],
          pendingCount: (tasks as any[]).reduce((count, t) => (t.status === 'pending' ? count + 1 : count), 0),
          currentTask: (tasks as any[]).find(t => t.status === 'in_progress')?.description,
        },
      };
    } catch (error) {
      return handleOperationFailure('implement', error);
    }
  },
};
