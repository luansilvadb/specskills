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
const markdown_1 = require("../utils/markdown");
const skills_1 = require("../utils/skills");
const validation_1 = require("../utils/validation");
// Helper function to validate project setup
function validateProjectSetup(conductorDir) {
    const requiredFiles = ['product.md', 'tech-stack.md', 'workflow.md'];
    const missingFiles = requiredFiles.filter(f => !(0, fileSystem_1.fileExists)(path.join(conductorDir, f)));
    if (missingFiles.length > 0) {
        return {
            success: false,
            message: '[SKIP] Conductor is not set up. Please run /setup.',
        };
    }
    return null;
}
// Helper function to read and parse tracks
function readAndParseTracks(conductorDir) {
    const tracksContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'index.md'));
    if (!tracksContent) {
        return {
            tracks: [],
            result: {
                success: false,
                message: 'No tracks found. Create a track first with /newTrack.',
            }
        };
    }
    const tracks = (0, markdown_1.parseTracksIndex)(tracksContent);
    if (tracks.length === 0) {
        return {
            tracks: [],
            result: {
                success: false,
                message: 'The tracks file is empty or malformed. No tracks to implement.',
            }
        };
    }
    return { tracks, result: null };
}
// Helper function to select a track based on arguments or automatic selection
function selectTrack(tracks, contextArgs) {
    const trackDescription = contextArgs.join(' ').trim();
    let selectedTrack = null;
    let selectionMode = '';
    if (trackDescription) {
        // Find track by description or ID
        const searchTerm = trackDescription.toLowerCase();
        const matches = tracks.filter(t => t.description.toLowerCase().includes(searchTerm) ||
            t.folderPath.toLowerCase().includes(searchTerm));
        if (matches.length === 1) {
            selectedTrack = matches[0];
            selectionMode = `matched by "${trackDescription}"`;
        }
        else if (matches.length > 1) {
            // Priority: exact match on description
            const exactMatch = matches.find(t => t.description.toLowerCase() === searchTerm);
            if (exactMatch) {
                selectedTrack = exactMatch;
                selectionMode = `exact match for "${trackDescription}"`;
            }
            else {
                return {
                    selectedTrack: null,
                    selectionMode: '',
                    result: {
                        success: false,
                        message: `[WARNING] Multiple tracks match "${trackDescription}":\n${matches.map(m => `- ${m.description}`).join('\n')}\n\nPlease be more specific.`,
                    }
                };
            }
        }
        else {
            return {
                selectedTrack: null,
                selectionMode: '',
                result: {
                    success: false,
                    message: `[ERROR] No track found matching "${trackDescription}".`,
                }
            };
        }
    }
    else {
        // If no track selected, prioritize "in_progress", then find first incomplete
        selectedTrack = tracks.find(t => t.status === 'in_progress') || null;
        if (selectedTrack) {
            selectionMode = 'automatically selected (active track)';
        }
        else {
            selectedTrack = tracks.find(t => t.status === 'pending') || null;
            if (selectedTrack) {
                selectionMode = 'automatically selected (next pending track)';
            }
        }
    }
    if (!selectedTrack) {
        return {
            selectedTrack: null,
            selectionMode: '',
            result: {
                success: true,
                message: '[SUCCESS] All tracks are completed! Use /newTrack to start something new.',
            }
        };
    }
    // ADICIONAR VERIFICAÇÃO DE APROVAÇÃO ANTES DA EXECUÇÃO AUTOMÁTICA
    if (!trackDescription) {
        // Se não foi fornecido um identificador explícito, pedir confirmação
        return {
            selectedTrack: selectedTrack,
            selectionMode: selectionMode,
            result: {
                success: true,
                message: `[CONFIRMATION] About to implement: **${selectedTrack.description}**\n\nDo you want to proceed with this track?`,
                questions: [
                    {
                        header: "Confirm Implementation",
                        question: `Implement track: "${selectedTrack.description}"?`,
                        type: "choice",
                        options: [
                            { label: "Yes, proceed", description: "Start implementing the selected track" },
                            { label: "No, select another", description: "Return to track selection" }
                        ]
                    }
                ],
                data: {
                    trackId: selectedTrack.folderPath,
                    confirmProceed: true
                }
            }
        };
    }
    return { selectedTrack, selectionMode, result: null };
}
// Helper function to validate track structure
function validateTrackStructure(trackDir, selectedTrack) {
    // Validate: project code should NOT be inside track directory
    const misplacedProjectDir = path.join(trackDir, 'project');
    if ((0, fileSystem_1.fileExists)(misplacedProjectDir)) {
        const trackId = path.basename(selectedTrack.folderPath);
        return {
            success: false,
            message: `[WARNING] Estrutura incorreta detectada!\n\nCódigo do projeto encontrado em: ${misplacedProjectDir}\n\nCorreção necessária:\n- Artefatos da track (spec.md, plan.md) → ficam em ${trackDir}\n- Código do projeto → deve estar fora do conductor (ex: projects/${trackId}/)\n\nMova o conteúdo de 'project/' para fora do conductor e remova essa pasta.`,
        };
    }
    return null;
}
// Helper function to read and parse track plan
function readAndParseTrackPlan(trackDir, selectedTrack, conductorDir) {
    const planPath = path.join(trackDir, 'plan.md');
    if (!(0, fileSystem_1.fileExists)(planPath)) {
        return {
            planContent: null,
            activeSkills: [],
            tasks: [],
            result: {
                success: false,
                message: `Plan not found for track "${selectedTrack.description}".`,
            }
        };
    }
    const planContent = (0, fileSystem_1.readFile)(planPath);
    if (!planContent) {
        return {
            planContent: null,
            activeSkills: [],
            tasks: [],
            result: {
                success: false,
                message: 'Could not read plan file.',
            }
        };
    }
    // Check for active skills (Option B: Global Scan)
    const allSkills = (0, skills_1.loadAllSkills)(path.join(conductorDir, 'skills'));
    const activeSkills = (0, skills_1.findActiveSkills)(planContent, allSkills);
    // Parse tasks
    const tasks = (0, markdown_1.parsePlanTasks)(planContent);
    return { planContent, activeSkills, tasks, result: null };
}
// Helper function to generate implementation guidance message
function generateImplementationGuidance(selectedTrack, tasks, activeSkills, conductorDir, trackDir) {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const currentTask = tasks.find(t => t.status === 'in_progress');
    let message = `> [!IMPORTANT]\n> **STOP: LENDO PROTOCOLO DE EXECUÇÃO!**\n> \n> Você está implementando: **${selectedTrack.description}**\n> \n> **DIRETIVA DO CONDUCTOR:**\n> 1. Leia os protocolos das skills ativas abaixo.\n> 2. Siga as instruções da tarefa atual antes de prosseguir.\n> 3. NÃO inicie o trabalho sem confirmar o "Mindset" da track.\n\n`;
    message += `[ANALYSIS] Resolve: Track\n`;
    if (activeSkills.length > 0) {
        message += `[ACTIVE SKILLS] ${activeSkills.map(s => `[${s.title}]`).join(' ')}\n`;
    }
    message += `\n---\n\n`;
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
    // Load context files
    const specPath = path.join(trackDir, 'spec.md');
    let contextInfo = '';
    if ((0, fileSystem_1.fileExists)(specPath)) {
        const specContent = (0, fileSystem_1.readFile)(specPath);
        if (specContent) {
            contextInfo += '\n[SPECIFICATION] **Track Specification**\n';
            contextInfo += `Available at: \`${specPath}\`\n`;
        }
    }
    // Load product and tech stack context
    const productContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'product.md'));
    const techStackContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'tech-stack.md'));
    const workflowContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'workflow.md'));
    if (productContent || techStackContent || workflowContent) {
        contextInfo += '\n[CONTEXT] **Project Context**\n';
        contextInfo += '> [!NOTE]\n';
        if (productContent) {
            const goalMatch = productContent.match(/## (?:Project Goal|Overview)\r?\n\r?([\s\S]+?)(?:\r?\n\r?##|$)/);
            if (goalMatch)
                contextInfo += `> **Goal:** ${goalMatch[1].trim().split(/\r?\n/)[0]}\n`;
            contextInfo += '> - [x] Product definition loaded\n';
        }
        if (techStackContent) {
            const languageMatch = techStackContent.match(/- Primary:\s*(.+)/);
            if (languageMatch)
                contextInfo += `> **Tech stack:** ${languageMatch[1].trim()}\n`;
            contextInfo += '> - [x] Tech stack guidelines loaded\n';
        }
        if (workflowContent)
            contextInfo += '> - [x] Workflow process loaded\n';
    }
    let protocolsInfo = '';
    if (activeSkills.length > 0) {
        protocolsInfo += `\n> [!IMPORTANT]\n> **PRE-FLIGHT PROTOCOLS (Protocolos Ativos):**\n`;
        protocolsInfo += `> Siga rigorosamente estas diretivas de resiliência e arquitetura nesta etapa:\n>\n`;
        for (const skill of activeSkills) {
            protocolsInfo += `> **[${skill.title}]**:\n`;
            if (skill.purpose) {
                protocolsInfo += `> - *Foco:* ${skill.purpose}\n`;
            }
            if (skill.protocol) {
                protocolsInfo += `> - *Diretiva:* ${skill.protocol.replace(/\n/g, '\n>   ')}\n`;
            }
            else {
                protocolsInfo += `> - *Diretiva:* Protocolo padrão ativo nos artefatos.\n`;
            }
            protocolsInfo += `>\n`;
        }
        contextInfo += protocolsInfo;
    }
    message += contextInfo;
    message += `\n---\n\n> [!NOTE]\n`;
    message += `> **Workflow Reminder**\n`;
    message += '> 1. Mark task as in progress: `[ ]` → `[~]`\n';
    message += '> 2. Write failing tests first (Red phase)\n';
    message += '> 3. Implement to pass tests (Green phase)\n';
    message += '> 4. Commit changes\n';
    message += '> 5. Mark complete: `[~]` → `[x]`\n';
    return message;
}
/**
 * Verify process integrity before allowing implementation
 * Ensures all required steps have been properly followed
 */
function verifyProcessIntegrity(trackDir, selectedTrack) {
    // Check if spec.md exists and has been reviewed/approved
    const specPath = path.join(trackDir, 'spec.md');
    if (!(0, fileSystem_1.fileExists)(specPath)) {
        return {
            success: false,
            message: `[BLOCKED] **Process Integrity Check Failed**\n\nO arquivo de especificação \`spec.md\` não existe para a track: **${selectedTrack.description}**\n\nO Conductor exige que:\n1. A especificação seja criada com /newTrack\n2. O plano seja revisado antes da implementação\n3. A aprovação seja dada explicitamente\n\nPor favor, execute /newTrack primeiro para criar os documentos necessários.`
        };
    }
    // Check if plan.md exists and has been reviewed
    const planPath = path.join(trackDir, 'plan.md');
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
    // Check if the spec has been approved (contains approval indicators)
    const specContent = (0, fileSystem_1.readFile)(specPath);
    if (!specContent) {
        return {
            success: false,
            message: `[BLOCKED] **Process Integrity Check Failed**\n\nNão foi possível ler o arquivo de especificação para **${selectedTrack.description}**.\n\nO processo do Conductor exige que a especificação esteja completa e revisada antes da implementação.`
        };
    }
    // Check if all checks pass, return null (no error)
    return null;
}
// Helper function to handle track completion logic
function handleTrackCompletion(selectedTrack, tasks) {
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
                        type: "yesno"
                    },
                    {
                        header: "Cleanup",
                        question: "What should I do with this track folder?",
                        type: "choice",
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
                    protocol: '4.0'
                }
            }
        };
    }
    return { completed: false, result: null };
}
exports.implementCommand = {
    name: 'implement',
    description: 'Executes the tasks defined in the specified track\'s plan',
    execute: async (context, args) => {
        try {
            // 1. Setup Check Protocol
            const setupValidation = (0, validation_1.validateSetup)(context);
            if (!setupValidation.success) {
                return {
                    success: false,
                    message: `[SETUP CHECK FAILED] ${setupValidation.message}\n\n${setupValidation.errors?.join('\n')}\n\nConductor is not set up. Please run /setup.`
                };
            }
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
            // Validate project setup
            const validation = validateProjectSetup(conductorDir);
            if (validation) {
                return validation;
            }
            // 2. Track Selection Validation
            const trackSelectionValidation = (0, validation_1.validateTrackSelection)(context);
            if (!trackSelectionValidation.success) {
                return {
                    success: false,
                    message: `[TRACK SELECTION FAILED] ${trackSelectionValidation.message}\n\n${trackSelectionValidation.errors?.join('\n')}`
                };
            }
            // Read and parse tracks
            const { tracks, result: tracksResult } = readAndParseTracks(conductorDir);
            if (tracksResult) {
                return tracksResult;
            }
            // Select track
            const { selectedTrack, selectionMode: _, result: selectionResult } = selectTrack(tracks, args); // Renomeei selectionMode para _
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
            const structureValidation = validateTrackStructure(path.join(conductorDir, selectedTrack.folderPath), selectedTrack);
            if (structureValidation) {
                return structureValidation;
            }
            // Verify process integrity before allowing implementation
            const integrityCheck = verifyProcessIntegrity(path.join(conductorDir, selectedTrack.folderPath), selectedTrack);
            if (integrityCheck) {
                return integrityCheck;
            }
            // Read and parse track plan
            const { planContent: __, activeSkills, tasks, result: planResult } = readAndParseTrackPlan(path.join(conductorDir, selectedTrack.folderPath), selectedTrack, conductorDir);
            if (planResult) {
                return planResult;
            }
            // Handle track completion if applicable
            const { completed, result: completionResult } = handleTrackCompletion(selectedTrack, tasks);
            if (completed) {
                return completionResult;
            }
            // Generate implementation guidance
            const message = generateImplementationGuidance(selectedTrack, tasks, activeSkills, conductorDir, path.join(conductorDir, selectedTrack.folderPath));
            return {
                success: true,
                message,
                data: {
                    track: selectedTrack,
                    tasks,
                    pendingCount: tasks.filter(t => t.status === 'pending').length,
                    currentTask: tasks.find(t => t.status === 'in_progress')?.description,
                },
            };
        }
        catch (error) {
            return (0, validation_1.handleOperationFailure)('implement', error);
        }
    },
};
