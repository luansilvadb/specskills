/**
 * Helper functions for implementation guidance generation
 */

import * as path from 'path';
import { fileExists, readFile } from '../utils/fileSystem';

// Generate the initial guidance message
export function generateInitialGuidanceMessage(selectedTrack: any): string {
  let message = `> [!IMPORTANT]\n> **STOP: LENDO PROTOCOLO DE EXECUÇÃO!**\n> \n> Você está implementando: **${selectedTrack.description}**\n> \n> **DIRETIVA DO CONDUCTOR:**\n> 1. Leia os protocolos das skills ativas abaixo.\n> 2. Siga as instruções da tarefa atual antes de prosseguir.\n> 3. NÃO inicie o trabalho sem confirmar o "Mindset" da track.\n> 4. Execute tarefas individualmente seguindo o ciclo TDD (Red, Green, Refactor).\n> 5. Marque cada tarefa como concluída antes de passar para a próxima.\n\n`;
  message += `[ANALYSIS] Resolve: Track\n`;

  return message;
}

// Generate the task status section
export function generateTaskStatusSection(currentTask: any, pendingTasks: any[]): string {
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
export function generateSpecInfo(trackDir: string): string {
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

// Generate project context information
export function generateProjectContextInfo(conductorDir: string): string {
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

// Generate protocols information
export function generateProtocolsInfo(activeSkills: any[]): string {
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

// Generate workflow instructions
export function generateWorkflowInstructions(): string {
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
export function generateContextInfo(conductorDir: string, trackDir: string, activeSkills: any[]): string {
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
export function generateImplementationGuidance(selectedTrack: any, tasks: any[], activeSkills: any[], conductorDir: string, trackDir: string): string {
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