"use strict";
/**
 * Helper functions for implementation guidance generation
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
exports.generateInitialGuidanceMessage = generateInitialGuidanceMessage;
exports.generateTaskStatusSection = generateTaskStatusSection;
exports.generateSpecInfo = generateSpecInfo;
exports.generateProjectContextInfo = generateProjectContextInfo;
exports.generateProtocolsInfo = generateProtocolsInfo;
exports.generateWorkflowInstructions = generateWorkflowInstructions;
exports.generateContextInfo = generateContextInfo;
exports.generateImplementationGuidance = generateImplementationGuidance;
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
// Generate the initial guidance message
function generateInitialGuidanceMessage(selectedTrack) {
    let message = `> [!IMPORTANT]\n> **STOP: LENDO PROTOCOLO DE EXECUÇÃO!**\n> \n> Você está implementando: **${selectedTrack.description}**\n> \n> **DIRETIVA DO CONDUCTOR:**\n> 1. Leia os protocolos das skills ativas abaixo.\n> 2. Siga as instruções da tarefa atual antes de prosseguir.\n> 3. NÃO inicie o trabalho sem confirmar o "Mindset" da track.\n> 4. Execute tarefas individualmente seguindo o ciclo TDD (Red, Green, Refactor).\n> 5. Marque cada tarefa como concluída antes de passar para a próxima.\n\n`;
    message += `[ANALYSIS] Resolve: Track\n`;
    return message;
}
// Generate the task status section
function generateTaskStatusSection(currentTask, pendingTasks) {
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
// Generate specification information
function generateSpecInfo(trackDir) {
    const specPath = path.join(trackDir, 'spec.md');
    let contextInfo = '';
    if ((0, fileSystem_1.fileExists)(specPath)) {
        const specContent = (0, fileSystem_1.readFile)(specPath);
        if (specContent) {
            contextInfo += '\n[SPECIFICATION] **Track Specification**\n';
            contextInfo += `Available at: \`${specPath}\`\n`;
        }
    }
    return contextInfo;
}
// Generate project context information
function generateProjectContextInfo(conductorDir) {
    let contextInfo = '';
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
    return contextInfo;
}
// Generate protocols information
function generateProtocolsInfo(activeSkills) {
    let protocolsInfo = `\n> [!IMPORTANT]\n> **PRE-FLIGHT PROTOCOLS (Protocolos Ativos):**\n`;
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
    return protocolsInfo;
}
// Generate workflow instructions
function generateWorkflowInstructions() {
    let message = `\n---\n\n> [!NOTE]\n`;
    message += `> **Atomic Task Execution Workflow**\n`;
    message += '> 1. Focus on ONE task at a time\n';
    message += '> 2. Execute TDD cycle: Red (write failing test) → Green (make it pass) → Refactor (optimize)\n';
    message += '> 3. Mark task complete: `[~]` → `[x]` in plan.md\n';
    message += '> 4. Verify task completion before moving to next\n';
    message += '> 5. At phase boundary: Generate manual test plan and get confirmation\n';
    return message;
}
// Generate context information
function generateContextInfo(conductorDir, trackDir, activeSkills) {
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
// Generate implementation guidance message
function generateImplementationGuidance(selectedTrack, tasks, activeSkills, conductorDir, trackDir) {
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
