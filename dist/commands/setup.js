"use strict";
/**
 * Setup command - Initializes the Conductor environment
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
exports.setupCommand = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
const skills_1 = require("../utils/skills");
const markdown_1 = require("../utils/markdown");
const templates_1 = require("../utils/templates");
const TEMPLATE_BASE = path.join(__dirname, '..', '..', 'templates');
const SCAFFOLD_DIR = path.join(TEMPLATE_BASE, 'scaffold');
const CONDUCTOR_SCAFFOLD = path.join(SCAFFOLD_DIR, 'conductor');
const AGENT_SCAFFOLD = path.join(SCAFFOLD_DIR, '.agents');
exports.setupCommand = {
    name: 'setup',
    description: 'Scaffolds the project and sets up the Conductor environment',
    execute: async (context, args) => {
        try {
            // Allow overriding target directory (conductor setup [path])
            const targetRoot = (args.length > 0 && typeof args[0] === 'string')
                ? path.resolve(context.projectRoot, args[0])
                : context.projectRoot;
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(targetRoot);
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
            (0, fileSystem_1.ensureDir)(conductorDir);
            (0, fileSystem_1.ensureDir)(path.join(conductorDir, 'tracks'));
            (0, fileSystem_1.ensureDir)(path.join(conductorDir, 'archive'));
            (0, fileSystem_1.ensureDir)(path.join(conductorDir, 'skills'));
            (0, fileSystem_1.ensureDir)(path.join(conductorDir, 'styleguides'));
            (0, fileSystem_1.ensureDir)(path.join(conductorDir, 'templates'));
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
            if (fs.existsSync(sourceSkillsDir) && (0, fileSystem_1.listFiles)(targetSkillsDir).length <= 1) { // Only copy if empty or just catalog
                await copyDirectory(sourceSkillsDir, targetSkillsDir);
                statusSummary += '- Initialized skills library\n';
            }
            // 4.3 Copy Customizable Templates
            const targetTemplatesDir = path.join(conductorDir, 'templates');
            const sourceTemplatesDir = path.join(CONDUCTOR_SCAFFOLD, 'templates');
            if (fs.existsSync(sourceTemplatesDir) && (0, fileSystem_1.listFiles)(targetTemplatesDir).length === 0) {
                await copyDirectory(sourceTemplatesDir, targetTemplatesDir);
                statusSummary += '- Initialized customizable templates\n';
            }
            // 5. Batch Questioning for Greenfield (Optional/Informational)
            let greenfieldQuestions = [];
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
                const content = (0, templates_1.processTemplate)(conductorDir, 'product.md', {
                    GOAL_SECTION: goalSection
                }, generateProductTemplate(isBrownfield));
                (0, fileSystem_1.writeFile)(path.join(conductorDir, 'product.md'), content);
                statusSummary += '- Created initial product.md\n';
            }
            if (!audit.hasTechStack) {
                const content = (0, templates_1.processTemplate)(conductorDir, 'tech-stack.md', {}, generateTechStackTemplate());
                (0, fileSystem_1.writeFile)(path.join(conductorDir, 'tech-stack.md'), content);
                statusSummary += '- Created tech-stack.md\n';
            }
            if (!audit.hasWorkflow) {
                const content = (0, templates_1.processTemplate)(conductorDir, 'workflow.md', {}, generateWorkflowTemplate());
                (0, fileSystem_1.writeFile)(path.join(conductorDir, 'workflow.md'), content);
                statusSummary += '- Created workflow.md\n';
            }
            if (!audit.hasIndex) {
                const content = (0, templates_1.processTemplate)(conductorDir, 'index.md', {}, generateIndexTemplate());
                (0, fileSystem_1.writeFile)(path.join(conductorDir, 'index.md'), content);
                statusSummary += '- Created project index.md\n';
            }
            if (!audit.hasGuidelines) {
                const content = (0, templates_1.processTemplate)(conductorDir, 'product-guidelines.md', {}, generateGuidelinesTemplate());
                (0, fileSystem_1.writeFile)(path.join(conductorDir, 'product-guidelines.md'), content);
                statusSummary += '- Created product-guidelines.md\n';
            }
            // 4.1. NATIVE SKILL RECONCILIATION (Self-Healing)
            const skillsDir = path.join(conductorDir, 'skills');
            const catalogPath = path.join(skillsDir, 'catalog.md');
            if (!audit.hasCatalog || (0, fileSystem_1.listFiles)(skillsDir, '.md').length > 0) {
                try {
                    const allSkills = (0, skills_1.loadAllSkills)(skillsDir);
                    const currentCatalog = (0, fileSystem_1.fileExists)(catalogPath) ? ((0, fileSystem_1.readFile)(catalogPath) || '') : '';
                    const updatedCatalog = (0, markdown_1.reconcileCatalog)(currentCatalog, allSkills);
                    if (updatedCatalog !== currentCatalog) {
                        (0, fileSystem_1.writeFile)(catalogPath, updatedCatalog);
                        statusSummary += audit.hasCatalog ? '- Synchronized skills catalog\n' : '- Created skills catalog (Self-Healed)\n';
                    }
                }
                catch (e) {
                    statusSummary += '! Failed to reconcile skills catalog\n';
                }
            }
            // 5. Copy code styleguides if folder doesn't exist or is empty
            const styleguideDir = path.join(conductorDir, 'styleguides');
            if (!fs.existsSync(styleguideDir) || (0, fileSystem_1.listFiles)(styleguideDir, '.md').length === 0) {
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
        }
        catch (error) {
            return {
                success: false,
                message: `Setup failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
};
function detectProjectMaturity(projectRoot) {
    // Use Git for instant high-performance audit if available
    try {
        const gitStatus = (0, fileSystem_1.execCommand)('git status --porcelain', projectRoot);
        if (gitStatus !== null) {
            // If we are in a git repo with ANY tracked or untracked files (excluding conductor), it's brownfield
            const files = (0, fileSystem_1.execCommand)('git ls-files --exclude-standard -co', projectRoot);
            if (files && files.trim().length > 0) {
                return { isBrownfield: true, indicator: 'Git Repository' };
            }
        }
    }
    catch (e) {
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
        if ((0, fileSystem_1.fileExists)(path.join(projectRoot, indicator.file))) {
            return { isBrownfield: true, indicator: indicator.type };
        }
    }
    return { isBrownfield: false, indicator: 'Greenfield' };
}
async function copyDirectory(source, target) {
    if (!fs.existsSync(source))
        return;
    try {
        fs.cpSync(source, target, { recursive: true });
    }
    catch (e) {
        console.error(`Failed to copy ${source} to ${target}:`, e);
    }
}
function performProjectAudit(conductorDir) {
    const audit = {
        hasProduct: (0, fileSystem_1.fileExists)(path.join(conductorDir, 'product.md')),
        hasTechStack: (0, fileSystem_1.fileExists)(path.join(conductorDir, 'tech-stack.md')),
        hasWorkflow: (0, fileSystem_1.fileExists)(path.join(conductorDir, 'workflow.md')),
        hasGuidelines: (0, fileSystem_1.fileExists)(path.join(conductorDir, 'product-guidelines.md')),
        hasIndex: (0, fileSystem_1.fileExists)(path.join(conductorDir, 'index.md')),
        hasCatalog: (0, fileSystem_1.fileExists)(path.join(conductorDir, 'skills', 'catalog.md')),
    };
    const isComplete = audit.hasProduct && audit.hasTechStack && audit.hasWorkflow && audit.hasIndex && audit.hasCatalog;
    let lastStage = null;
    if (audit.hasWorkflow)
        lastStage = 'Workflow';
    else if (audit.hasTechStack)
        lastStage = 'Tech Stack';
    else if (audit.hasProduct)
        lastStage = 'Product Definition';
    return { ...audit, isComplete, lastStage };
}
async function copyCodeStyleguides(conductorDir, _projectRoot) {
    const templatesDir = path.join(TEMPLATE_BASE, 'code_styleguides');
    const targetDir = path.join(conductorDir, 'styleguides');
    if (!fs.existsSync(templatesDir)) {
        return;
    }
    const files = (0, fileSystem_1.listFiles)(templatesDir, '.md');
    for (const file of files) {
        const content = (0, fileSystem_1.readFile)(path.join(templatesDir, file));
        if (content) {
            (0, fileSystem_1.writeFile)(path.join(targetDir, file), content);
        }
    }
}
function generateIndexTemplate() {
    return `# Project Tracks

## Active Tracks

No tracks defined yet. Use \`/newTrack\` to create one.

---

## Completed Tracks

None yet.
`;
}
function generateProductTemplate(isBrownfield = false) {
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
function generateGuidelinesTemplate() {
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
function generateTechStackTemplate() {
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
function generateWorkflowTemplate() {
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
