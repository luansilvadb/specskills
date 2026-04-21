"use strict";
/**
 * Register Skill command - Reconciles the skills catalog with installed skills
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
exports.registerSkillCommand = void 0;
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
const skills_1 = require("../utils/skills");
const markdown_1 = require("../utils/markdown");
exports.registerSkillCommand = {
    name: 'registerSkill',
    description: 'Reconciles and registers all installed skills into the catalog.md',
    execute: async (context) => {
        try {
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
            const skillsDir = path.join(conductorDir, 'skills');
            const catalogPath = path.join(skillsDir, 'catalog.md');
            // 1. Load all installed skills
            const allSkills = (0, skills_1.loadAllSkills)(skillsDir);
            if (allSkills.length === 0) {
                return {
                    success: false,
                    message: 'No skills found in conductor/skills/. Please add some skills first.',
                };
            }
            // 2. Read existing catalog or start fresh (Self-Healing)
            let catalogContent = '';
            let isNew = !(0, fileSystem_1.fileExists)(catalogPath);
            if (!isNew) {
                catalogContent = (0, fileSystem_1.readFile)(catalogPath) || '';
            }
            // 3. Reconcile
            const updatedCatalog = (0, markdown_1.reconcileCatalog)(catalogContent, allSkills);
            // 4. Write back
            (0, fileSystem_1.writeFile)(catalogPath, updatedCatalog);
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
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to register skills: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
};
