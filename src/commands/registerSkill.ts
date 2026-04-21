/**
 * Register Skill command - Reconciles the skills catalog with installed skills
 */
 
import * as path from 'path';
import type { CommandContext, CommandResult, SlashCommand } from '../types';
import {
  fileExists,
  readFile,
  writeFile,
  resolveConductorDir,
} from '../utils/fileSystem';
import { loadAllSkills } from '../utils/skills';
import { reconcileCatalog } from '../utils/markdown';

export const registerSkillCommand: SlashCommand = {
  name: 'registerSkill',
  description: 'Reconciles and registers all installed skills into the catalog.md',
  execute: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const conductorDir = resolveConductorDir(context.projectRoot);
      const skillsDir = path.join(conductorDir, 'skills');
      const catalogPath = path.join(skillsDir, 'catalog.md');

      // 1. Load all installed skills
      const allSkills = loadAllSkills(skillsDir);
      if (allSkills.length === 0) {
        return {
          success: false,
          message: 'No skills found in conductor/skills/. Please add some skills first.',
        };
      }

      // 2. Read existing catalog or start fresh (Self-Healing)
      let catalogContent = '';
      let isNew = !fileExists(catalogPath);
      
      if (!isNew) {
        catalogContent = readFile(catalogPath) || '';
      }

      // 3. Reconcile
      const updatedCatalog = reconcileCatalog(catalogContent, allSkills);

      // 4. Write back
      writeFile(catalogPath, updatedCatalog);

      const status = isNew ? 'created' : 'updated';
      return {
        success: true,
        message: `[SUCCESS] **Catalog ${status} successfully!**\n\n- Scanned: ${allSkills.length} skills\n- Location: \`conductor/skills/catalog.md\`\n\nThe catalog is now synchronized with all installed skill definitions.`,
        data: {
          skillsCount: allSkills.length,
          catalogPath,
          status
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to register skills: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};
