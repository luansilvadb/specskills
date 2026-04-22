import * as fs from 'fs';
import * as path from 'path';
import type { CommandResult } from '../types';
import { readFile, writeFile } from './fileSystem';
import { parsePlanTasks } from './markdown';
import { GitManager } from './gitUtils';

interface SyncAnalysis {
  changesDetected: boolean;
  suggestedUpdates: {
    file: string;
    changes: string[];
    additions?: string[];
    removals?: string[];
    diff?: string; // Visual diff representation
    originalContent?: string;
    updatedContent?: string;
  }[];
  recommendations: string[];
}

/**
 * Analisa as alterações implementadas e sugere atualizações nos documentos de alto nível
 */
export async function analyzeAndSyncDocumentation(
  trackDir: string,
  conductorDir: string,
  selectedTrack: any
): Promise<SyncAnalysis> {
  // Ler o spec.md da track para entender o que foi implementado
  const specPath = path.join(trackDir, 'spec.md');
  const specContent = readFile(specPath) || '';

  // Ler o plano completo
  const planPath = path.join(trackDir, 'plan.md');
  const planContent = readFile(planPath) || '';

  // Ler as tarefas concluídas
  const tasks = parsePlanTasks(planContent);
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const analysis: SyncAnalysis = {
    changesDetected: false,
    suggestedUpdates: [],
    recommendations: []
  };

  // Analisar alterações e atualizar product.md
  const productPath = path.join(conductorDir, 'product.md');
  if (fs.existsSync(productPath)) {
    const productContent = readFile(productPath) || '';
    const productUpdates = await analyzeProductMdUpdates(specContent, planContent, productContent, completedTasks);

    if (productUpdates.changes.length > 0 || productUpdates.additions?.length > 0 || productUpdates.removals?.length > 0) {
      // Generate visual diff for product.md
      const updatedProductContent = generateUpdatedDocumentContent(productContent, productUpdates);

      analysis.suggestedUpdates.push({
        file: 'product.md',
        changes: productUpdates.changes,
        additions: productUpdates.additions,
        removals: productUpdates.removals,
        diff: generateVisualDiff(productContent, updatedProductContent),
        originalContent: productContent,
        updatedContent: updatedProductContent
      });
      analysis.changesDetected = true;
    }
  }

  // Analisar alterações e atualizar tech-stack.md
  const techStackPath = path.join(conductorDir, 'tech-stack.md');
  if (fs.existsSync(techStackPath)) {
    const techStackContent = readFile(techStackPath) || '';
    const techStackUpdates = await analyzeTechStackUpdates(specContent, planContent, techStackContent, completedTasks);

    if (techStackUpdates.changes.length > 0 || techStackUpdates.additions?.length > 0 || techStackUpdates.removals?.length > 0) {
      // Generate visual diff for tech-stack.md
      const updatedTechStackContent = generateUpdatedDocumentContent(techStackContent, techStackUpdates);

      analysis.suggestedUpdates.push({
        file: 'tech-stack.md',
        changes: techStackUpdates.changes,
        additions: techStackUpdates.additions,
        removals: techStackUpdates.removals,
        diff: generateVisualDiff(techStackContent, updatedTechStackContent),
        originalContent: techStackContent,
        updatedContent: updatedTechStackContent
      });
      analysis.changesDetected = true;
    }
  }

  // Adicionar recomendações gerais
  analysis.recommendations.push(
    `Track "${selectedTrack.description}" foi concluída com sucesso.`,
    `Considere atualizar o roadmap no conductor/index.md para refletir esta conclusão.`
  );

  return analysis;
}

/**
 * Generate updated document content based on suggested updates
 */
function generateUpdatedDocumentContent(originalContent: string, updates: { changes?: string[], additions?: string[], removals?: string[] }): string {
  let updatedContent = originalContent;

  // Add new sections or append to existing sections
  if (updates.additions && updates.additions.length > 0) {
    updatedContent += '\n\n## Atualizações da Trilha\n';
    updatedContent += updates.additions.map(add => `- ${add}`).join('\n');
  }

  // Add change notes
  if (updates.changes && updates.changes.length > 0) {
    updatedContent += '\n\n## Mudanças Adicionais\n';
    updatedContent += updates.changes.map(change => `- ${change}`).join('\n');
  }

  return updatedContent;
}

/**
 * Generate visual diff between original and updated content
 */
function generateVisualDiff(originalContent: string, updatedContent: string): string {
  // Simplified diff generation - in practice, you might want to use a more sophisticated diff algorithm
  const originalLines = originalContent.split('\n');
  const updatedLines = updatedContent.split('\n');

  let diff = '```diff\n';

  // For simplicity, we'll just show the key differences
  // A more complete implementation would show line-by-line changes
  diff += '+ [Nova seção: Atualizações da Trilha]\n';
  diff += '+ [Conteúdo adicionado refletindo as mudanças implementadas]\n';
  diff += '+ [Novas funcionalidades ou tecnologias mencionadas]\n';
  diff += '...\n';
  diff += '```';

  return diff;
}

/**
 * Analisa o product.md para sugerir atualizações baseadas na implementação
 */
async function analyzeProductMdUpdates(
  specContent: string,
  planContent: string,
  currentProductContent: string,
  completedTasks: any[]
): Promise<{ changes: string[]; additions?: string[]; removals?: string[] }> {
  const changes: string[] = [];
  const additions: string[] = [];

  // Extrair objetivo e escopo do spec
  const objectiveMatch = specContent.match(/## Objective[\s\S]*?\n([\s\S]*?)(?=\n##|$)/i);
  const objective = objectiveMatch ? objectiveMatch[1].trim() : specContent.substring(0, 200);

  // Extrair recursos ou features do spec
  const featuresMatch = specContent.match(/## Features[\s\S]*?\n([\s\S]*?)(?=\n##|$)/i) ||
                       specContent.match(/## Requirements[\s\S]*?\n([\s\S]*?)(?=\n##|$)/i) ||
                       specContent.match(/## Specification[\s\S]*?\n([\s\S]*?)(?=\n##|$)/i);

  let features = '';
  if (featuresMatch) {
    features = featuresMatch[1];
    // Remover listas de tarefas pendentes, manter apenas features implementadas
    const completedFeatureMatches = features.match(/- \[x\]\s*(.*)/g);
    if (completedFeatureMatches) {
      const completedFeatures = completedFeatureMatches.map(match => match.replace(/- \[x\]\s*/, '').trim());
      additions.push(...completedFeatures);
    }
  }

  // Verificar se novas funcionalidades precisam ser adicionadas
  const newFeatures = completedTasks
    .filter(task => task.description.toLowerCase().includes('feature') ||
                   task.description.toLowerCase().includes('functionality') ||
                   task.description.toLowerCase().includes('component') ||
                   task.description.toLowerCase().includes('screen') ||
                   task.description.toLowerCase().includes('page'))
    .map(task => task.description);

  if (newFeatures.length > 0) {
    additions.push(...newFeatures);
  }

  // Verificar se o objetivo principal foi alcançado
  if (objective && currentProductContent.toLowerCase().indexOf(objective.toLowerCase()) === -1) {
    changes.push('Objetivo da trilha implementado, pode requerer atualização no product.md');
    additions.push(`Objetivo atingido: ${objective.substring(0, 100)}...`);
  }

  // Adicionar tarefas concluídas como evidência de progresso
  if (completedTasks.length > 0) {
    const taskDescriptions = completedTasks.map(task => task.description);
    additions.push(`Etapa concluída: ${taskDescriptions.length} tarefas realizadas`);
  }

  return { changes, additions: additions.length > 0 ? additions : undefined };
}

/**
 * Analisa o tech-stack.md para sugerir atualizações baseadas na implementação
 */
async function analyzeTechStackUpdates(
  specContent: string,
  planContent: string,
  currentTechStackContent: string,
  completedTasks: any[]
): Promise<{ changes: string[]; additions?: string[]; removals?: string[] }> {
  const changes: string[] = [];
  const additions: string[] = [];

  // Identificar tecnologias usadas na implementação
  // Buscar padrões de tecnologia no spec, no plano e nas tarefas completas
  const contentToSearch = specContent + planContent + completedTasks.map(t => t.description).join(' ');

  // Procurar por tecnologias mencionadas no conteúdo
  const techMatches = contentToSearch.match(/\b(JavaScript|TypeScript|React|Vue|Angular|Node\.js|Express|Fastify|Python|Django|Flask|Java|Spring|Go|Rust|Docker|Kubernetes|AWS|Azure|GCP|PostgreSQL|MySQL|MongoDB|Redis|GraphQL|REST|Tailwind|Bootstrap|SASS|Webpack|Vite|Jest|Cypress|MaterialUI|Next\.js|Nuxt\.js|Prisma|TypeORM|Redux|Zustand)\b/gi) || [];
  const usedTechnologies = techMatches ? [...new Set(techMatches)] : [];

  if (usedTechnologies.length > 0) {
    additions.push(`Tecnologias utilizadas: ${usedTechnologies.join(', ')}`);
  }

  // Identificar novos padrões ou práticas mencionadas
  const patternMatches = contentToSearch.match(/\b(MVC|MVVM|Clean Architecture|Microservices|Monolith|DDD|TDD|BDD|CI\/CD|Agile|Scrum|Kanban|SOLID|KISS|DRY|GRASP|CQRS|Event Sourcing|Repository Pattern|Factory Pattern|Singleton|Observer|Decorator|Strategy|Adapter)\b/g) || [];

  if (patternMatches.length > 0) {
    additions.push(`Padrões e práticas aplicadas: ${[...new Set(patternMatches)].join(', ')}`);
  }

  // Analisar tarefas completadas para identificar infraestrutura ou ferramentas
  const infrastructureTasks = completedTasks.filter(task =>
    task.description.toLowerCase().includes('deploy') ||
    task.description.toLowerCase().includes('database') ||
    task.description.toLowerCase().includes('api') ||
    task.description.toLowerCase().includes('authentication') ||
    task.description.toLowerCase().includes('security') ||
    task.description.toLowerCase().includes('testing') ||
    task.description.toLowerCase().includes('docker') ||
    task.description.toLowerCase().includes('container')
  );

  if (infrastructureTasks.length > 0) {
    const infraDescs = infrastructureTasks.map(t => t.description);
    additions.push(`Infraestrutura e ferramentas implementadas: ${infraDescs.join('; ')}`);
  }

  return { changes, additions: additions.length > 0 ? additions : undefined };
}

/**
 * Aplica as atualizações sugeridas aos documentos
 */
export async function applyDocumentationUpdates(
  conductorDir: string,
  updates: SyncAnalysis['suggestedUpdates']
): Promise<boolean> {
  let success = true;

  for (const update of updates) {
    const filePath = path.join(conductorDir, update.file);

    if (fs.existsSync(filePath) && update.updatedContent) {
      try {
        writeFile(filePath, update.updatedContent);
        console.log(`Documento ${update.file} atualizado com sucesso.`);
      } catch (error) {
        console.error(`Erro ao atualizar ${update.file}:`, error);
        success = false;
      }
    } else if (fs.existsSync(filePath) && update.additions) {
      // Fallback to the original logic if updatedContent is not available
      let content = readFile(filePath);

      // Aplicar adições
      if (update.additions && update.additions.length > 0) {
        content += '\n\n## Atualizações da Trilha\n';
        content += update.additions.map(add => `- ${add}`).join('\n');
      }

      // Aplicar mudanças gerais
      if (update.changes && update.changes.length > 0) {
        content += '\n\n## Mudanças Adicionais\n';
        content += update.changes.map(change => `- ${change}`).join('\n');
      }

      // Escrever o conteúdo atualizado
      try {
        writeFile(filePath, content || '');
        console.log(`Documento ${update.file} atualizado com sucesso.`);
      } catch (error) {
        console.error(`Erro ao atualizar ${update.file}:`, error);
        success = false;
      }
    }
  }

  return success;
}

/**
 * Handle user response to documentation sync proposal
 */
export async function handleDocumentationSyncResponse(
  response: string,
  conductorDir: string,
  updates: SyncAnalysis['suggestedUpdates'],
  trackDir: string,
  selectedTrack: any
): Promise<CommandResult> {
  if (response.toLowerCase().includes('yes') || response.toLowerCase().includes('sim') || response.toLowerCase().includes('aprovar')) {
    // Caminho Feliz: Aplicar atualizações de documentação
    const success = await applyDocumentationUpdates(conductorDir, updates);

    if (success) {
      // Commit the documentation updates
      const gitManager = new GitManager(conductorDir);
      const commitMessage = `docs: Update product and tech stack after completing track "${selectedTrack.description}"`;
      const commitResult = await gitManager.createAtomicCommit(commitMessage);

      return {
        success: true,
        message: `[DOC SYNC APPROVED] **${selectedTrack.description}**\n\nDocumentation updated successfully:\n- product.md updated\n- tech-stack.md updated\n- Commit created: ${commitResult.message}`
      };
    } else {
      return {
        success: false,
        message: `[DOC SYNC FAILED] Could not apply documentation updates.`
      };
    }
  } else {
    return {
      success: false,
      message: `[DOC SYNC REJECTED] **${selectedTrack.description}**\n\nUser declined documentation updates. The implementation is complete but documentation remains unchanged.\n\nWould you like to manually update the documentation or proceed anyway?`,
      questions: [
        {
          header: "Documentation Update Decision",
          question: "How would you like to proceed with documentation?",
          type: "choice",
          options: [
            { label: "Update documentation later", description: "Continue without documentation updates" },
            { label: "Try different updates", description: "Propose different documentation changes" },
            { label: "Manual update", description: "I'll update documentation myself" }
          ]
        }
      ]
    };
  }
}