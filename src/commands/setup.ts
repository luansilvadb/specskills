/**
 * Setup command - Initializes the Conductor environment
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CommandContext, CommandResult, SlashCommand } from '../types';
import {
  ensureDir,
  fileExists,
  readFile,
  writeFile,
  resolveConductorDir,
  listFiles,
  execCommand,
} from '../utils/fileSystem';
import { loadAllSkills } from '../utils/skills';
import { reconcileCatalog } from '../utils/markdown';
import { processTemplate } from '../utils/templates';

const TEMPLATE_BASE = path.join(__dirname, '..', '..', 'templates');
const SCAFFOLD_DIR = path.join(TEMPLATE_BASE, 'scaffold');
const CONDUCTOR_SCAFFOLD = path.join(SCAFFOLD_DIR, 'conductor');
const AGENT_SCAFFOLD = path.join(SCAFFOLD_DIR, '.agents');

export const setupCommand: SlashCommand = {
  name: 'setup',
  description: 'Scaffolds the project and sets up the Conductor environment',
  execute: async (context: CommandContext, args: string[]): Promise<CommandResult> => {
    try {
      // Allow overriding target directory (conductor setup [path])
      const targetRoot = (args.length > 0 && typeof args[0] === 'string') 
        ? path.resolve(context.projectRoot, args[0]) 
        : context.projectRoot;
      
      const conductorDir = resolveConductorDir(targetRoot);
      console.log(`\n[ANALYSIS] Target Directory: ${targetRoot}`);
      console.log(`[ANALYSIS] Conductor Directory: ${conductorDir}\n`);

      // Safeguard: Prevent initializing inside node_modules
      if (conductorDir.toLowerCase().includes('node_modules')) {
        return {
          success: false,
          message: `Refusing to initialize Conductor inside node_modules: ${conductorDir}. Please run from your project root.`,
        };
      }

      // 1. Audit Project State (Residue Logic)
      const audit = performProjectAudit(conductorDir);
      
      // If fully complete, halt
      if (audit.isComplete) {
        return {
          success: false,
          message: '[SKIP] Conductor is already fully initialized. Use /newTrack or /implement.',
        };
      }

      // 2. Project Maturity Detection
      const { isBrownfield, indicator } = detectProjectMaturity(targetRoot);
      const welcomeMessage = isBrownfield 
        ? `Brownfield project detected (${indicator}).` 
        : "Greenfield project detected.";

      // 3. Create core directory structure (Immediate Feedback)
      ensureDir(conductorDir);
      ensureDir(path.join(conductorDir, 'tracks'));
      ensureDir(path.join(conductorDir, 'archive'));
      ensureDir(path.join(conductorDir, 'skills'));
      ensureDir(path.join(conductorDir, 'styleguides'));
      ensureDir(path.join(conductorDir, 'templates'));

      // 4. Progressive Initialization
      let statusSummary = '';

      // 4.1 Copy Agent Infrastructure (.agents folder)
      const agentDir = path.join(targetRoot, '.agents');
      if (!fs.existsSync(agentDir)) {
        await copyDirectory(AGENT_SCAFFOLD, agentDir);
        statusSummary += '- Copied agent infrastructure (.agents)\n';
      }

      // 4.2 Copy Default Skills library
      const targetSkillsDir = path.join(conductorDir, 'skills');
      const sourceSkillsDir = path.join(CONDUCTOR_SCAFFOLD, 'skills');
      if (fs.existsSync(sourceSkillsDir) && listFiles(targetSkillsDir).length <= 1) { // Only copy if empty or just catalog
        await copyDirectory(sourceSkillsDir, targetSkillsDir);
        statusSummary += '- Initialized skills library\n';
      }

      // 4.3 Copy Customizable Templates
      const targetTemplatesDir = path.join(conductorDir, 'templates');
      const sourceTemplatesDir = path.join(CONDUCTOR_SCAFFOLD, 'templates');
      if (fs.existsSync(sourceTemplatesDir) && listFiles(targetTemplatesDir).length === 0) {
        await copyDirectory(sourceTemplatesDir, targetTemplatesDir);
        statusSummary += '- Initialized customizable templates\n';
      }

      // 5. Batch Questioning for Greenfield (Optional/Informational)
      let greenfieldQuestions: any[] = [];
      if (!isBrownfield && !audit.hasProduct) {
        greenfieldQuestions = [
          {
            header: "Project Goal",
            question: "What do you want to build?",
            type: "text"
          },
          {
            header: "Target Users",
            question: "Who is this product for?",
            type: "choice"
          }
        ];
      }

      if (!audit.hasProduct) {
        const goalSection = isBrownfield 
          ? '' 
          : '\n## Project Goal\n\nDefine the primary objective of this new project.\n';
        
        const content = processTemplate(conductorDir, 'product.md', {
          GOAL_SECTION: goalSection
        }, generateProductTemplate(isBrownfield));
        
        writeFile(path.join(conductorDir, 'product.md'), content);
        statusSummary += '- Created initial product.md\n';
      }

      if (!audit.hasTechStack) {
        const content = processTemplate(conductorDir, 'tech-stack.md', {}, generateTechStackTemplate());
        writeFile(path.join(conductorDir, 'tech-stack.md'), content);
        statusSummary += '- Created tech-stack.md\n';
      }

      if (!audit.hasWorkflow) {
        const content = processTemplate(conductorDir, 'workflow.md', {}, generateWorkflowTemplate());
        writeFile(path.join(conductorDir, 'workflow.md'), content);
        statusSummary += '- Created workflow.md\n';
      }

      if (!audit.hasIndex) {
        const content = processTemplate(conductorDir, 'index.md', {}, generateIndexTemplate());
        writeFile(path.join(conductorDir, 'index.md'), content);
        statusSummary += '- Created project index.md\n';
      }

      if (!audit.hasGuidelines) {
        const content = processTemplate(conductorDir, 'product-guidelines.md', {}, generateGuidelinesTemplate());
        writeFile(path.join(conductorDir, 'product-guidelines.md'), content);
        statusSummary += '- Created product-guidelines.md\n';
      }

      // 4.1. NATIVE SKILL RECONCILIATION (Self-Healing)
      const skillsDir = path.join(conductorDir, 'skills');
      const catalogPath = path.join(skillsDir, 'catalog.md');
      
      if (!audit.hasCatalog || listFiles(skillsDir, '.md').length > 0) {
        try {
          const allSkills = loadAllSkills(skillsDir);
          const currentCatalog = fileExists(catalogPath) ? (readFile(catalogPath) || '') : '';
          const updatedCatalog = reconcileCatalog(currentCatalog, allSkills);
          
          if (updatedCatalog !== currentCatalog) {
            writeFile(catalogPath, updatedCatalog);
            statusSummary += audit.hasCatalog ? '- Synchronized skills catalog\n' : '- Created skills catalog (Self-Healed)\n';
          }
        } catch (e) {
          statusSummary += '! Failed to reconcile skills catalog\n';
        }
      }

      // 5. Copy code styleguides if folder doesn't exist or is empty
      const styleguideDir = path.join(conductorDir, 'styleguides');
      if (!fs.existsSync(styleguideDir) || listFiles(styleguideDir, '.md').length === 0) {
        await copyCodeStyleguides(conductorDir, targetRoot);
        statusSummary += '- Copied code styleguides\n';
      }

      const stageMessage = audit.lastStage 
        ? `Resuming setup from [${audit.lastStage}].`
        : "Starting fresh setup.";

      return {
        success: true,
        message: `${welcomeMessage}\n${stageMessage}\n\n**Actions Taken:**\n${statusSummary || '- No new actions needed (Audit synchronized)'}\n\nConductor environment initialized at: **${path.resolve(conductorDir)}**`,
        questions: greenfieldQuestions.length > 0 ? greenfieldQuestions : undefined
      };
    } catch (error) {
      return {
        success: false,
        message: `Setup failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

function detectProjectMaturity(projectRoot: string): { isBrownfield: boolean; indicator: string } {
  // Use Git for instant high-performance audit if available
  try {
    const gitStatus = execCommand('git status --porcelain', projectRoot);
    if (gitStatus !== null) {
      // If we are in a git repo with ANY tracked or untracked files (excluding conductor), it's brownfield
      const files = execCommand('git ls-files --exclude-standard -co', projectRoot);
      if (files && files.trim().length > 0) {
        return { isBrownfield: true, indicator: 'Git Repository' };
      }
    }
  } catch (e) {
    // Git not available or not in repo, fallback to manual indicators
  }

  const indicators = [
    { file: 'package.json', type: 'Node.js' },
    { file: 'requirements.txt', type: 'Python' },
    { file: 'go.mod', type: 'Go' },
    { file: 'Cargo.toml', type: 'Rust' },
    { file: 'pom.xml', type: 'Java' },
    { file: '.git', type: 'Git' },
    { file: 'src', type: 'Source Directory' },
  ];

  for (const indicator of indicators) {
    if (fileExists(path.join(projectRoot, indicator.file))) {
      return { isBrownfield: true, indicator: indicator.type };
    }
  }

  return { isBrownfield: false, indicator: 'Greenfield' };
}

interface ProjectAudit {
  hasProduct: boolean;
  hasTechStack: boolean;
  hasWorkflow: boolean;
  hasGuidelines: boolean;
  hasIndex: boolean;
  hasCatalog: boolean;
  isComplete: boolean;
  lastStage: string | null;
}

async function copyDirectory(source: string, target: string): Promise<void> {
  if (!fs.existsSync(source)) return;
  
  try {
    fs.cpSync(source, target, { recursive: true });
  } catch (e) {
    console.error(`Failed to copy ${source} to ${target}:`, e);
  }
}

function performProjectAudit(conductorDir: string): ProjectAudit {
  const audit = {
    hasProduct: fileExists(path.join(conductorDir, 'product.md')),
    hasTechStack: fileExists(path.join(conductorDir, 'tech-stack.md')),
    hasWorkflow: fileExists(path.join(conductorDir, 'workflow.md')),
    hasGuidelines: fileExists(path.join(conductorDir, 'product-guidelines.md')),
    hasIndex: fileExists(path.join(conductorDir, 'index.md')),
    hasCatalog: fileExists(path.join(conductorDir, 'skills', 'catalog.md')),
  };

  const isComplete = audit.hasProduct && audit.hasTechStack && audit.hasWorkflow && audit.hasIndex && audit.hasCatalog;
  
  let lastStage = null;
  if (audit.hasWorkflow) lastStage = 'Workflow';
  else if (audit.hasTechStack) lastStage = 'Tech Stack';
  else if (audit.hasProduct) lastStage = 'Product Definition';

  return { ...audit, isComplete, lastStage };
}

async function copyCodeStyleguides(conductorDir: string, _projectRoot: string): Promise<void> {
  const templatesDir = path.join(TEMPLATE_BASE, 'code_styleguides');
  const targetDir = path.join(conductorDir, 'styleguides');

  if (!fs.existsSync(templatesDir)) {
    return;
  }

  const files = listFiles(templatesDir, '.md');
  for (const file of files) {
    const content = readFile(path.join(templatesDir, file));
    if (content) {
      writeFile(path.join(targetDir, file), content);
    }
  }
}


function generateIndexTemplate(): string {
  return `# Project Tracks

## Active Tracks

No tracks defined yet. Use \`/newTrack\` to create one.

---

## Completed Tracks

None yet.
`;
}

function generateProductTemplate(isBrownfield: boolean = false): string {
  const goalSection = isBrownfield 
    ? '' 
    : '\n## Project Goal\n\nDefine the primary objective of this new project.\n';

  return `# Product Definition

## Overview

Define your product's purpose and value proposition here.
${goalSection}
## Target Users

Who will use this product?

## Core Features

- Feature 1
- Feature 2
- Feature 3

## Success Metrics

How will we measure success?
`;
}

function generateGuidelinesTemplate(): string {
  return `# Product Guidelines

## Design Principles

- Principle 1
- Principle 2

## User Experience Goals

- Goal 1
- Goal 2

## Constraints

- Constraint 1
- Constraint 2
`;
}

function generateTechStackTemplate(): string {
  return `# Technology Stack

## Language

- Primary: TypeScript

## Framework

- To be defined

## Database

- To be defined

## Testing

- To be defined

## Deployment

- To be defined
`;
}

function generateWorkflowTemplate(): string {
  return `# Project Workflow

## Guiding Principles

- > [!NOTE]
  > **The Plan is the Source of Truth:** All work must be tracked in \`plan.md\`.
- > [!NOTE]
  > **Test-Driven Development:** Write tests before implementing.
- > [!NOTE]
  > **High Code Coverage:** Aim for >80% code coverage.

## Task Workflow

1. **Select Task:** Choose the next available task from \`plan.md\`
2. **Mark In Progress:** Update task from \`[ ]\` to \`[~]\`
3. **Write Failing Tests (Red Phase)**
4. **Implement to Pass Tests (Green Phase)**
5. **Commit Changes**
6. **Mark Complete:** Update task from \`[~]\` to \`[x]\`

## Quality Gates

> [!IMPORTANT]
> Before marking any task complete, verify:
- [ ] All tests pass
- [ ] Code coverage meets requirements (>80%)
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
`;
}
