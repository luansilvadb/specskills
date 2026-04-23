"use strict";
/**
 * Revert command - Safely reverts tasks, phases, or entire tracks
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
exports.revertCommand = void 0;
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
const gitUtils_1 = require("../utils/gitUtils");
const implement_helpers_1 = require("./implement.helpers");
// Helper function to select a track based on arguments
function selectTrack(tracks, contextArgs) {
    const trackDescription = contextArgs.join(' ').trim();
    if (!trackDescription) {
        return {
            selectedTrack: null,
            result: {
                success: false,
                message: '[ERROR] Please specify which track to revert. Use /revert <track_description>.',
            }
        };
    }
    // Find track by description or ID
    const searchTerm = trackDescription.toLowerCase();
    const matches = tracks.filter(t => t.description.toLowerCase().includes(searchTerm) ||
        t.folderPath.toLowerCase().includes(searchTerm));
    if (matches.length === 0) {
        return {
            selectedTrack: null,
            result: {
                success: false,
                message: `[ERROR] No track found matching "${trackDescription}".`,
            }
        };
    }
    else if (matches.length > 1) {
        return {
            selectedTrack: null,
            result: {
                success: false,
                message: `[WARNING] Multiple tracks match "${trackDescription}":\n${matches.map(m => `- ${m.description}`).join('\n')}\n\nPlease be more specific.`,
            }
        };
    }
    else {
        return { selectedTrack: matches[0], result: null };
    }
}
// Helper function to analyze git history for reversion
async function analyzeGitHistory(trackDir, level) {
    const gitManager = new gitUtils_1.GitManager(trackDir);
    // Get git log to analyze commit history
    try {
        const { stdout } = gitManager['execGit'](['log', '--oneline', '--graph', '-10']); // Last 10 commits
        // Based on the reversion level, identify commits to revert
        let commitsToRevert = [];
        if (level === 'task') {
            // Find commits related to specific tasks
            commitsToRevert = stdout.split('\n')
                .filter(line => line.includes('feat(task):'))
                .map(line => line.trim().split(' ')[0]) // Extract commit hash
                .slice(0, 3); // Last 3 task commits
        }
        else if (level === 'phase') {
            // Find checkpoint commits for phases
            commitsToRevert = stdout.split('\n')
                .filter(line => line.includes('checkpoint('))
                .map(line => line.trim().split(' ')[0])
                .slice(0, 1); // Most recent phase checkpoint
        }
        else { // track
            // All commits in the track
            commitsToRevert = stdout.split('\n')
                .filter(line => line.trim() !== '')
                .map(line => line.trim().split(' ')[0]);
        }
        if (commitsToRevert.length === 0) {
            return {
                success: false,
                message: `[INFO] No ${level} commits found to revert in this track.`
            };
        }
        return {
            success: true,
            message: `[ANALYSIS] Found ${commitsToRevert.length} ${level} commits to revert:\n${commitsToRevert.map(hash => `- ${hash}`).join('\n')}\n\nShould I proceed with reverting these commits?`,
            data: {
                commitsToRevert,
                level,
                canRevert: true
            }
        };
    }
    catch (error) {
        return {
            success: false,
            message: `[ERROR] Could not analyze git history: ${error.message}`
        };
    }
}
// Helper function to revert commits
async function performReversion(trackDir, commits) {
    const gitManager = new gitUtils_1.GitManager(trackDir);
    try {
        // Perform git revert for each commit
        const revertedCommits = [];
        const failedReverts = [];
        for (const commitHash of commits) {
            try {
                gitManager['execGit'](['revert', '--no-commit', commitHash]);
                revertedCommits.push(commitHash);
            }
            catch (error) {
                failedReverts.push(`${commitHash}: ${error.message}`);
            }
        }
        // If all commits were reverted successfully, commit the revert
        if (failedReverts.length === 0 && revertedCommits.length > 0) {
            gitManager['execGit'](['commit', '-m', `revert(${commits.length} commits): Reverting ${revertedCommits.length} ${revertedCommits.length === 1 ? 'commit' : 'commits'} due to reversion request`]);
            return {
                success: true,
                message: `[SUCCESS] Successfully reverted ${revertedCommits.length} commits:\n${revertedCommits.map(hash => `- ${hash}`).join('\n')}`
            };
        }
        else if (revertedCommits.length > 0) {
            // Some commits were reverted, some failed
            return {
                success: true, // Partial success
                message: `[PARTIAL] Reverted ${revertedCommits.length} commits, ${failedReverts.length} failed:\n\nReverted:\n${revertedCommits.map(hash => `- ${hash}`).join('\n')}\n\nFailed:\n${failedReverts.join('\n')}`
            };
        }
        else {
            // No commits were reverted
            return {
                success: false,
                message: `[FAILURE] Failed to revert any commits:\n${failedReverts.join('\n')}`
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: `[ERROR] Reversion process failed: ${error.message}`
        };
    }
}
// Helper function to update plan.md to unmark completed tasks
function updatePlanForReversion(trackDir, level) {
    const planPath = path.join(trackDir, 'plan.md');
    const planContent = (0, fileSystem_1.readFile)(planPath) || '';
    if (!planContent) {
        return {
            success: false,
            message: 'Plan file not found for reversion.'
        };
    }
    // Replace completed markers [x] back to pending [ ] based on reversion level
    let updatedContent = planContent;
    if (level === 'task') {
        // Only change the most recently completed task back to in-progress [~]
        const lastCompletedTaskRegex = /(.*?)- \[x\] ([^\n]*)/;
        if (lastCompletedTaskRegex.test(updatedContent)) {
            updatedContent = updatedContent.replace(/- \[x\] ([^\n]*)([\s\S]*)$/, '- [~] $1$2');
        }
    }
    else if (level === 'phase') {
        // Change all tasks in the most recent phase back to pending [ ]
        // This is a simplified implementation - in reality, you'd identify tasks by phase
        updatedContent = updatedContent.replace(/- \[x\]/g, '- [ ]').replace(/- \[~\]/g, '- [ ]');
    }
    else { // track
        // Change all completed and in-progress tasks back to pending
        updatedContent = updatedContent.replace(/- \[x\]/g, '- [ ]').replace(/- \[~\]/g, '- [ ]');
    }
    // Write updated content back to file
    try {
        (0, fileSystem_1.writeFile)(planPath, updatedContent);
        return {
            success: true,
            message: `[UPDATE] Plan updated to reflect reversion of ${level} status. Tasks reverted to ${level === 'task' ? 'in-progress' : 'pending'} state.`
        };
    }
    catch (error) {
        return {
            success: false,
            message: `[ERROR] Could not update plan file: ${error.message}`
        };
    }
}
exports.revertCommand = {
    name: 'revert',
    description: 'Safely reverts tasks, phases, or entire tracks',
    execute: async (context, args) => {
        try {
            // 1. Setup Check Protocol
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
            // Validate project setup
            const validation = (0, implement_helpers_1.validateProjectSetup)(conductorDir);
            if (validation) {
                return validation;
            }
            // 2. Track Selection
            const { tracks, result: tracksResult } = (0, implement_helpers_1.readAndParseTracks)(conductorDir, 'The tracks file is empty or malformed. No tracks to revert.');
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
                    message: 'No track selected for reversion. Please specify a track to revert.'
                };
            }
            // Determine reversion level from arguments
            let level = 'task'; // Default
            if (args.length > 1) {
                const levelArg = args[1].toLowerCase();
                if (['task', 'phase', 'track'].includes(levelArg)) {
                    level = levelArg;
                }
            }
            // Analyze git history for the requested level
            const analysisResult = await analyzeGitHistory(path.join(conductorDir, selectedTrack.folderPath), level);
            if (!analysisResult.success) {
                return analysisResult;
            }
            // Check if user confirmed the reversion (this would be handled by the UI)
            if (context.data?.confirmed) {
                // Perform the reversion
                const revertResult = await performReversion(path.join(conductorDir, selectedTrack.folderPath), analysisResult.data?.commitsToRevert || []);
                if (revertResult.success) {
                    // Update the plan to reflect the reversion
                    const planUpdateResult = updatePlanForReversion(path.join(conductorDir, selectedTrack.folderPath), level);
                    return {
                        success: true,
                        message: `${revertResult.message}\n\n${planUpdateResult.message}\n\nReversion of ${level} "${selectedTrack.description}" completed.`
                    };
                }
                else {
                    return revertResult;
                }
            }
            else {
                // Return the analysis for user confirmation
                return analysisResult;
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Revert failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
};
