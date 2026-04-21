/**
 * New Track command - Creates a new track with spec and plan
 */

import * as path from 'path';
import type { CommandContext, CommandResult, SlashCommand, Skill } from '../types';
import {
  ensureDir,
  fileExists,
  readFile,
  writeFile,
  resolveConductorDir,
} from '../utils/fileSystem';
import { loadAllSkills } from '../utils/skills';
import { processTemplate } from '../utils/templates';
import { SkillCompositionEngine, CompositeSkillRecommender } from '../utils/skillComposition';

export const newTrackCommand: SlashCommand = {
  name: 'newTrack',
  description: 'Plans a track, generates track-specific spec documents and updates the tracks file',
  execute: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const conductorDir = resolveConductorDir(context.projectRoot);

      // Verify setup
      const requiredFiles = ['product.md', 'tech-stack.md', 'workflow.md'];
      const missingFiles = requiredFiles.filter(f => !fileExists(path.join(conductorDir, f)));

      if (missingFiles.length > 0) {
        return {
          success: false,
          message: 'Conductor is not set up. Please run /setup first.',
        };
      }

      // 1. Batch Questioning for Specification (Section 2.2 in original)
      if (context.args.length === 0) {
        return {
          success: true,
          message: `[TRACK] **Track Initialization**\n\nI'll now guide you through a series of questions to build a comprehensive specification for this track.`,
          questions: [
            {
              header: "Overview",
              question: "Briefly describe what this track will accomplish.",
              type: "text",
              placeholder: "e.g., Add JWT authentication to the API"
            },
            {
              header: "Requirements",
              question: "What are the functional requirements for this track?",
              type: "text",
              placeholder: "e.g., Create login endpoint, sign tokens, validate middleware"
            },
            {
              header: "Acceptance Criteria",
              question: "How will we know this is complete?",
              type: "text",
              placeholder: "e.g., User can login, unauthorized access returns 401"
            }
          ]
        };
      }

      // Generate track ID from description
      const trackDescription = context.args.join(' ').trim();
      const trackId = trackDescription
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30) // Limit length for stability
        .replace(/-+$/, ''); // Trim trailing hyphens

      const trackDir = path.join(conductorDir, 'tracks', trackId);

      const allSkills = loadAllSkills(path.join(conductorDir, 'skills'));

      // Enrich context with segmented info for weighted scoring
      const productContent = readFile(path.join(conductorDir, 'product.md')) || '';
      const techStackContent = readFile(path.join(conductorDir, 'tech-stack.md')) || '';

      // Pass segments: [Track Prompt] \n [Product] \n [Tech Stack]
      const contextDescription = `${trackDescription}\n${productContent}\n${techStackContent}`;

      console.log(`\n[ANALYSIS] Analyzing context for smart skill discovery...`);

      // Initialize skill composition engine and recommender
      const compositionEngine = new SkillCompositionEngine();
      const recommender = new CompositeSkillRecommender(compositionEngine);

      // Get both individual skills and compositions
      const { skills: scoredSkills, compositions: potentialCompositions } = recommender.recommendSkillsAndCompositions(contextDescription, allSkills);

      // Create a composition for all recommended skills if there are more than one
      if (scoredSkills.length > 1) {
        const composition = compositionEngine.createCompositionFromSkills(
          `auto-${trackId}`,
          `Track ${trackId} Skills Composition`,
          `Automatically generated composition for track ${trackDescription}`,
          scoredSkills.map(s => s.skill),
          [trackId, ...trackDescription.split(/\s+/)]
        );
        compositionEngine.registerComposition(composition);
        potentialCompositions.push(composition);
      }

      // Only include skills that actually exist in the system
      const recommendedSkills = scoredSkills.map(s => s.skill);

      // Verify that skills exist in the filesystem before using them
      const existingSkills = recommendedSkills.filter(skill => {
        const skillRootFile = path.join(conductorDir, 'skills', `${skill.id}.md`);
        const skillDirFile = path.join(conductorDir, 'skills', skill.id, 'SKILL.md');
        return fileExists(skillRootFile) || fileExists(skillDirFile);
      });

      // 2. Create track directory
      ensureDir(trackDir);

      // 3. Prepare variables for templates
      const now = new Date().toISOString().split('T')[0];
      const mindset = generateMindsetSection(existingSkills, potentialCompositions);
      const protocols = generateProtocolsSection(existingSkills, potentialCompositions);
      const skillsList = existingSkills.map(s => `- [ ] Mindset: ${s.trigger}`).join('\n') || '- [ ] No specific mindsets identified';
      const compositionsList = potentialCompositions.map(c => `- [ ] Composition: <composition: ${c.id}>`).join('\n') || '';

      const templateVars = {
        DESCRIPTION: trackDescription,
        TRACK_ID: trackId,
        DATE: now,
        ARCHITECTURE_MINDSET: mindset,
        SPECIALIZED_PROTOCOLS: protocols,
        RECOMMENDED_SKILLS: skillsList,
        RECOMMENDED_COMPOSITIONS: compositionsList,
        STATUS: 'pending'
      };

      // 4. Create track artifacts (Dynamic from templates)
      const specContent = processTemplate(conductorDir, 'spec.md', templateVars, generateSpecTemplate(trackDescription, existingSkills, potentialCompositions));
      const planContent = processTemplate(conductorDir, 'plan.md', templateVars, generatePlanTemplate(trackDescription, existingSkills, potentialCompositions, trackId));
      const indexContent = processTemplate(conductorDir, 'track-index.md', templateVars, generateTrackIndex(trackDescription, trackId));

      // 4.1 Validate injection (v1.2.3)
      const missingMindsetMatched = !planContent.includes(mindset) && mindset !== '';
      const missingProtocolsMatched = !planContent.includes(protocols) && protocols !== '';

      writeFile(path.join(trackDir, 'spec.md'), specContent);
      writeFile(path.join(trackDir, 'plan.md'), planContent);
      writeFile(path.join(trackDir, 'index.md'), indexContent);

      // 5. Update main tracks index
      await updateTracksIndex(conductorDir, trackDescription, trackId);

      let message = `> [!IMPORTANT]\n> **STOP: TRILHA CRIADA COM SUCESSO!**\n> \n> O plano de execução foi gerado em: \`tracks/${trackId}/plan.md\`\n> \n> **PROTOCOLO DE SEGURANÇA:**\n> 1. Você deve **LER** o arquivo \`plan.md\` agora.\n> 2. Você **NÃO DEVE** iniciar a implementação de código sem antes revisar o plano.\n> 3. Use o comando \`/implement\` para iniciar o ciclo de execução oficial.\n`;

      if (missingMindsetMatched || missingProtocolsMatched) {
        message += `\n> [!WARNING]\n> **Placeholders Ausentes:** Detectamos que o seu template customizado em \`conductor/templates/\` pode estar sem as tags \`{{ARCHITECTURE_MINDSET}}\` ou \`{{SPECIALIZED_PROTOCOLS}}\`. As habilidades não foram injetadas visualmente no arquivo, embora tenham sido detectadas.\n`;
      }

      if (existingSkills.length > 0) {
        message += `\n\n[INFO] **Recommended Skills Found:**\n`;
        for (const scored of scoredSkills.filter(s => existingSkills.includes(s.skill))) {
          const strength = scored.score > 30 ? 'Alta' : scored.score > 15 ? 'Média' : 'Baixa';
          message += `- ${scored.skill.title} (Sinal: **${strength}**)\n`;
        }
      }

      if (potentialCompositions.length > 0) {
        message += `\n\n[INFO] **Recommended Skill Compositions:**\n`;
        for (const comp of potentialCompositions) {
          message += `- ${comp.name}: ${comp.description}\n`;
        }
      }

      if (existingSkills.length > 0 || potentialCompositions.length > 0) {
        message += `\n> [!TIP]\n> **Ação Recomendada:** O agente deve incluir os gatilhos das skills e composições recomendadas na seção 'Recommended Skills' do seu plan.md para ativar os protocolos especializados.`;
      }

      return {
        success: true,
        message,
        data: {
          trackId,
          trackDir,
          description: trackDescription,
          recommendedSkills: existingSkills.map(s => s.id),
          recommendedCompositions: potentialCompositions.map(c => c.id),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create track: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};


function generateMindsetSection(skills: Skill[], compositions: any[] = []): string {
  if (skills.length === 0 && compositions.length === 0) return '';

  let section = '\n## Architecture Mindset\n\n';

  // Add individual skills
  for (const skill of skills) {
    if (skill.purpose) {
      section += `### ${skill.title}\n> [!TIP]\n> ${skill.purpose}\n\n`;
    }
  }

  // Add compositions
  for (const comp of compositions) {
    section += `### ${comp.name}\n> [!TIP]\n> ${comp.description}\n\n`;
  }

  return section;
}

function generateProtocolsSection(skills: Skill[], compositions: any[] = []): string {
  if (skills.length === 0 && compositions.length === 0) return '';

  let section = '\n## Specialized Protocols\n\n';

  // Add individual skill protocols
  for (const skill of skills) {
    if (skill.protocol) {
      section += `### ${skill.title}\n> [!IMPORTANT]\n> ${skill.protocol.replace(/\n/g, '\n> ')}\n\n`;
    }
  }

  // Add composition protocols
  for (const comp of compositions) {
    section += `### ${comp.name}\n> [!IMPORTANT]\n> ${comp.description.replace(/\n/g, '\n> ')}\n\n`;
  }

  return section;
}

function generateSpecTemplate(description: string, skills: Skill[], compositions: any[] = []): string {
  let skillSections = '';
  if (skills.length > 0 || compositions.length > 0) {
    skillSections = '\n## Architecture Mindset\n\n';
    for (const skill of skills) {
      if (skill.purpose) {
        skillSections += `### ${skill.title}\n> [!TIP]\n> ${skill.purpose}\n\n`;
      }
    }

    for (const comp of compositions) {
      skillSections += `### ${comp.name}\n> [!TIP]\n> ${comp.description}\n\n`;
    }
  }

  return `# Specification: ${description}

## Overview

Brief description of what this track will accomplish.

## Requirements

- Requirement 1
- Requirement 2
- Requirement 3

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes

Any technical considerations, dependencies, or constraints.
${skillSections}
## Recommended Skills & Mindsets

${skills.map(s => `- [ ] ${s.trigger}`).join('\n') || '- [ ] No specific skills identified'}
${compositions.length > 0 ? '\n## Recommended Skill Compositions\n\n' + compositions.map(c => `- [ ] ${c.name}: ${c.description}`).join('\n') : ''}

## Related Documents

- [Product Definition](../product.md)
- [Tech Stack](../tech-stack.md)
- [Plan](./plan.md)
`;
}

function generatePlanTemplate(description: string, skills: Skill[], compositions: any[] = [], trackId: string): string {
  let specializedProtocols = '';
  if (skills.length > 0 || compositions.length > 0) {
    specializedProtocols = '\n## Specialized Protocols\n\n';
    for (const skill of skills) {
      if (skill.protocol) {
        specializedProtocols += `### ${skill.title}\n> [!IMPORTANT]\n> ${skill.protocol.replace(/\n/g, '\n> ')}\n\n`;
      }
    }

    for (const comp of compositions) {
      specializedProtocols += `### ${comp.name}\n> [!IMPORTANT]\n> ${comp.description.replace(/\n/g, '\n> ')}\n\n`;
    }
  }

  return `# Implementation Plan: ${description}

## Phase 1: Setup

- [ ] Analyze requirements
- [ ] Design approach
- [ ] Set up test structure
${specializedProtocols}
## Phase 2: Implementation

- [ ] Implement core functionality
- [ ] Write tests
- [ ] Handle edge cases
- [ ] Task: Conductor - Phase Completion Verification & Checkpointing 'Implementation' (Protocol in workflow.md)

## Phase 3: Validation

- [ ] Run all tests
- [ ] Check code coverage (>80%)
- [ ] Code review
- [ ] Task: Conductor - Phase Completion Verification & Checkpointing 'Validation' (Protocol in workflow.md)

## Phase 4: Completion

- [ ] Final verification
- [ ] Update documentation
- [ ] Mark complete
- [ ] Task: Conductor - Phase Completion Verification & Checkpointing 'Completion' (Protocol in workflow.md)

---

## Recommended Skills & Mindsets

${skills.length > 0
  ? skills.map(s => `- [ ] Mindset: ${s.trigger}`).join('\n')
  : '> [!INFO]\n> **Nenhuma skill especializada** do catálogo foi identificada como mandatória para este contexto específico.\n> Prossiga utilizando as melhores práticas gerais de engenharia descritas no `tech-stack.md`.'}

## Recommended Skill Compositions
${compositions.length > 0
  ? compositions.map(c => `- [ ] Composition: <composition: ${c.id}>`).join('\n')
  : '> [!INFO]\n> **Nenhuma composição de skills** foi identificada como necessária para este contexto específico.'}

---

## Project Structure

> [!NOTE]
> **Importante:** Manter separação clara entre artefatos e código:
> - **Artefatos da track** (this folder): spec.md, plan.md, index.md
> - **Código do projeto** (outside conductor/): Crie em \`projects/${trackId}/\`
>
> NUNCA crie uma pasta \`project/\` dentro da track - use \`/implement\` para validar.

Use /implement to start working on this plan.
`;
}

function generateTrackIndex(description: string, trackId: string): string {
  return `# Track: ${description}

> [!NOTE]
> **Track ID:** \`${trackId}\`

## Documents

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)

## Status

- [ ] Not Started

Last updated: ${new Date().toISOString().split('T')[0]}
`;
}

async function updateTracksIndex(
  conductorDir: string,
  description: string,
  trackId: string
): Promise<void> {
  const indexPath = path.join(conductorDir, 'index.md');
  let content = readFile(indexPath);

  if (!content) {
    content = '# Project Tracks\n\nThis file tracks all major tracks using high-fidelity separators.\n';
  }

  const dateStr = new Date().toISOString().split('T')[0];
  
  // Add new track entry with separators and metadata
  const trackEntry = `\n---\n- [ ] **Track: ${description}**\n*Link: [${description}](./tracks/${trackId}/)*\n*Status: pending*\n*Created: ${dateStr}*\n`;

  // Append after introductory metadata (or just at end of sections before "How to Use")
  const footerMarker = '## How to Use';
  if (content.includes(footerMarker)) {
    content = content.replace(footerMarker, `${trackEntry}\n${footerMarker}`);
  } else {
    content += trackEntry;
  }

  writeFile(indexPath, content);
}
