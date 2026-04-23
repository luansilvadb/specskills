/**
 * Revert command - Safely reverts tasks, phases, or entire tracks
 */

import * as path from 'path';
import type { CommandContext, CommandResult, SlashCommand } from '../types';
import { readFile, writeFile, resolveConductorDir } from '../utils/fileSystem';
import { GitManager } from '../utils/gitUtils';
import { readAndParseTracks, validateProjectSetup } from './implement.helpers';

// Helper function to select a track based on arguments
function selectTrack(tracks: any[], contextArgs: string[]): { selectedTrack: any | null, result: CommandResult | null } {
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
  const matches = tracks.filter(t =>
    t.description.toLowerCase().includes(searchTerm) ||
    t.folderPath.toLowerCase().includes(searchTerm)
  );

  if (matches.length === 0) {
    return {
      selectedTrack: null,
      result: {
        success: false,
        message: `[ERROR] No track found matching "${trackDescription}".`,
      }
    };
  }

  if (matches.length > 1) {
    return {
      selectedTrack: null,
      result: {
        success: false,
        message: `[WARNING] Multiple tracks match "${trackDescription}":\n${matches.map(m => `- ${m.description}`).join('\n')}\n\nPlease be more specific.`,
      }
    };
  }

  return { selectedTrack: matches[0], result: null };
}

function extractCommitHashes(stdout: string, filter: (line: string) => boolean, limit?: number): string[] {
  const commits = stdout
    .split('\n')
    .filter(filter)
    .map(line => line.trim().split(' ')[0]);

  return typeof limit === 'number' ? commits.slice(0, limit) : commits;
}

function getCommitsToRevert(stdout: string, level: 'task' | 'phase' | 'track'): string[] {
  if (level === 'task') {
    return extractCommitHashes(stdout, line => line.includes('feat(task):'), 3);
  }
  if (level === 'phase') {
    return extractCommitHashes(stdout, line => line.includes('checkpoint('), 1);
  }
  return extractCommitHashes(stdout, line => line.trim() !== '');
}

// Helper function to analyze git history for reversion
async function analyzeGitHistory(trackDir: string, level: 'task' | 'phase' | 'track'): Promise<CommandResult> {
  const gitManager = new GitManager(trackDir);

  // Get git log to analyze commit history
  try {
    const { stdout } = gitManager['execGit'](['log', '--oneline', '--graph', '-10']); // Last 10 commits

    const commitsToRevert = getCommitsToRevert(stdout, level);

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
  } catch (error) {
    return {
      success: false,
      message: `[ERROR] Could not analyze git history: ${(error as Error).message}`
    };
  }
}

function parseRevertLevel(args: string[]): 'task' | 'phase' | 'track' {
  const levelArg = args[1]?.toLowerCase();
  if (levelArg === 'task' || levelArg === 'phase' || levelArg === 'track') {
    return levelArg;
  }
  return 'task';
}

// Helper function to revert commits
async function performReversion(trackDir: string, commits: string[]): Promise<CommandResult> {
  const gitManager = new GitManager(trackDir);

  try {
    // Perform git revert for each commit
    const revertedCommits: string[] = [];
    const failedReverts: string[] = [];

    for (const commitHash of commits) {
      try {
        gitManager['execGit'](['revert', '--no-commit', commitHash]);
        revertedCommits.push(commitHash);
      } catch (error) {
        failedReverts.push(`${commitHash}: ${(error as Error).message}`);
      }
    }

    // If all commits were reverted successfully, commit the revert
    if (failedReverts.length === 0 && revertedCommits.length > 0) {
      gitManager['execGit'](['commit', '-m', `revert(${commits.length} commits): Reverting ${revertedCommits.length} ${revertedCommits.length === 1 ? 'commit' : 'commits'} due to reversion request`]);

      return {
        success: true,
        message: `[SUCCESS] Successfully reverted ${revertedCommits.length} commits:\n${revertedCommits.map(hash => `- ${hash}`).join('\n')}`
      };
    } else if (revertedCommits.length > 0) {
      // Some commits were reverted, some failed
      return {
        success: true, // Partial success
        message: `[PARTIAL] Reverted ${revertedCommits.length} commits, ${failedReverts.length} failed:\n\nReverted:\n${revertedCommits.map(hash => `- ${hash}`).join('\n')}\n\nFailed:\n${failedReverts.join('\n')}`
      };
    } else {
      // No commits were reverted
      return {
        success: false,
        message: `[FAILURE] Failed to revert any commits:\n${failedReverts.join('\n')}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `[ERROR] Reversion process failed: ${(error as Error).message}`
    };
  }
}

// Helper function to update plan.md to unmark completed tasks
function updatePlanForReversion(trackDir: string, level: 'task' | 'phase' | 'track'): CommandResult {
  const planPath = path.join(trackDir, 'plan.md');
  const planContent = readFile(planPath) || '';

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
  } else if (level === 'phase') {
    // Change all tasks in the most recent phase back to pending [ ]
    // This is a simplified implementation - in reality, you'd identify tasks by phase
    updatedContent = updatedContent.replace(/- \[x\]/g, '- [ ]').replace(/- \[~\]/g, '- [ ]');
  } else { // track
    // Change all completed and in-progress tasks back to pending
    updatedContent = updatedContent.replace(/- \[x\]/g, '- [ ]').replace(/- \[~\]/g, '- [ ]');
  }

  // Write updated content back to file
  try {
    writeFile(planPath, updatedContent);

    return {
      success: true,
      message: `[UPDATE] Plan updated to reflect reversion of ${level} status. Tasks reverted to ${level === 'task' ? 'in-progress' : 'pending'} state.`
    };
  } catch (error) {
    return {
      success: false,
      message: `[ERROR] Could not update plan file: ${(error as Error).message}`
    };
  }
}

export const revertCommand: SlashCommand = {
  name: 'revert',
  description: 'Safely reverts tasks, phases, or entire tracks',
  execute: async (context: CommandContext, args: string[]): Promise<CommandResult> => {
    try {
      // 1. Setup Check Protocol
      const conductorDir = resolveConductorDir(context.projectRoot);

      // Validate project setup
      const validation = validateProjectSetup(conductorDir);
      if (validation) {
        return validation;
      }

      // 2. Track Selection
      const { tracks, result: tracksResult } = readAndParseTracks(
        conductorDir,
        'The tracks file is empty or malformed. No tracks to revert.'
      );
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

      const level = parseRevertLevel(args);

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
        } else {
          return revertResult;
        }
      } else {
        // Return the analysis for user confirmation
        return analysisResult;
      }
    } catch (error) {
      return {
        success: false,
        message: `Revert failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};
