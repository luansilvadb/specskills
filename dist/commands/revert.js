"use strict";
/**
 * Revert command - Reverts changes from a track or task
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
const markdown_1 = require("../utils/markdown");
exports.revertCommand = {
    name: 'revert',
    description: 'Reverts the last commit or a specific task',
    execute: async (context) => {
        try {
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
            // Verify setup
            if (!(0, fileSystem_1.fileExists)(conductorDir)) {
                return {
                    success: false,
                    message: '[SKIP] Conductor is not set up. Please run /setup first.',
                };
            }
            // Parse arguments
            const args = context.args;
            const revertType = args[0];
            // 1. GUIDED SELECTION: If no target provided, offer candidates
            if (!revertType) {
                return await presentRevertMenu(conductorDir);
            }
            if (revertType === 'last') {
                return await revertLastTask(conductorDir);
            }
            if (revertType === 'track' && args[1]) {
                const trackName = args.slice(1).join(' ');
                return await revertTrack(conductorDir, trackName);
            }
            if (revertType === 'task' && args[1]) {
                const taskName = args.slice(1).join(' ');
                return await revertTask(conductorDir, taskName);
            }
            return {
                success: false,
                message: `Unknown revert command: ${revertType}. Use 'last', 'track <name>', or 'task <name>'.`,
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Revert failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
};
async function presentRevertMenu(conductorDir) {
    const tracksContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'index.md'));
    if (!tracksContent)
        return { success: false, message: 'No tracks found.' };
    const tracks = (0, markdown_1.parseTracksIndex)(tracksContent);
    const candidates = [];
    // 1. Find In-Progress items
    for (const track of tracks) {
        const trackDir = path.join(conductorDir, track.folderPath);
        const planPath = path.join(trackDir, 'plan.md');
        if (!(0, fileSystem_1.fileExists)(planPath))
            continue;
        const planContent = (0, fileSystem_1.readFile)(planPath);
        if (!planContent)
            continue;
        const tasks = (0, markdown_1.parsePlanTasks)(planContent);
        const inProgress = tasks.filter(t => t.status === 'in_progress');
        const completed = tasks.filter(t => t.status === 'completed').reverse().slice(0, 2);
        for (const t of inProgress) {
            candidates.push({
                label: `[Task] ${t.description}`,
                description: `Track: ${track.description}`
            });
        }
        for (const t of completed) {
            candidates.push({
                label: `[Completed] ${t.description}`,
                description: `Track: ${track.description}`
            });
        }
    }
    if (candidates.length === 0) {
        return {
            success: false,
            message: 'No active or recently completed tasks found to revert.'
        };
    }
    return {
        success: true,
        message: '[ANALYSIS] **Revert Candidate Discovery**\nI\'ve found several items that might be candidates for reversion. Which one would you like to target?',
        questions: [
            {
                header: "Select Target",
                question: "Please choose which task to revert:",
                type: "choice",
                options: candidates.slice(0, 4).map(c => ({ label: c.label, description: c.description }))
            }
        ]
    };
}
async function revertLastTask(conductorDir) {
    // Find the most recently completed task
    const tracksContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'index.md'));
    if (!tracksContent) {
        return {
            success: false,
            message: 'No tracks found.',
        };
    }
    const tracks = (0, markdown_1.parseTracksIndex)(tracksContent);
    for (const track of tracks) {
        const trackDir = path.join(conductorDir, track.folderPath);
        const planPath = path.join(trackDir, 'plan.md');
        if (!(0, fileSystem_1.fileExists)(planPath)) {
            continue;
        }
        const planContent = (0, fileSystem_1.readFile)(planPath);
        if (!planContent) {
            continue;
        }
        const tasks = (0, markdown_1.parsePlanTasks)(planContent);
        const lastCompleted = tasks.slice().reverse()
            .find((t) => t.status === 'completed');
        if (lastCompleted) {
            // Revert the task status
            const updatedContent = (0, markdown_1.updateTaskStatus)(planContent, lastCompleted.description, 'pending');
            (0, fileSystem_1.writeFile)(planPath, updatedContent);
            let gitHint = '';
            if (lastCompleted.commitHash) {
                gitHint = `\n\n[INFO] **Git Action Recommended:**\nRun \`git revert ${lastCompleted.commitHash}\` to undo the code changes.`;
            }
            return {
                success: true,
                message: `Reverted task: "${lastCompleted.description}" in track "${track.description}"${gitHint}`,
                data: {
                    revertedTask: lastCompleted.description,
                    track: track.description,
                    commitHash: lastCompleted.commitHash
                },
            };
        }
    }
    return {
        success: false,
        message: 'No completed tasks found to revert.',
    };
}
async function revertTrack(conductorDir, trackName) {
    const tracksContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'index.md'));
    if (!tracksContent) {
        return {
            success: false,
            message: 'No tracks found.',
        };
    }
    const tracks = (0, markdown_1.parseTracksIndex)(tracksContent);
    const searchTerm = trackName.toLowerCase();
    const matches = tracks.filter(t => t.description.toLowerCase().includes(searchTerm));
    if (matches.length === 0) {
        return {
            success: false,
            message: `No track found matching "${trackName}".`,
        };
    }
    if (matches.length > 1) {
        return {
            success: false,
            message: `Multiple tracks match "${trackName}". Please be more specific.`,
        };
    }
    const track = matches[0];
    // Revert track to pending
    const updatedContent = (0, markdown_1.updateTrackStatus)(tracksContent, track.description, 'pending');
    (0, fileSystem_1.writeFile)(path.join(conductorDir, 'index.md'), updatedContent);
    // Also revert all tasks in the track
    const trackDir = path.join(conductorDir, track.folderPath);
    const planPath = path.join(trackDir, 'plan.md');
    if ((0, fileSystem_1.fileExists)(planPath)) {
        const planContent = (0, fileSystem_1.readFile)(planPath);
        if (planContent) {
            const tasks = (0, markdown_1.parsePlanTasks)(planContent);
            let updatedPlan = planContent;
            for (const task of tasks) {
                if (task.status !== 'pending') {
                    updatedPlan = (0, markdown_1.updateTaskStatus)(updatedPlan, task.description, 'pending');
                }
            }
            (0, fileSystem_1.writeFile)(planPath, updatedPlan);
        }
    }
    // --- ADVANCED GIT RECONCILIATION: Track Birth Discovery ---
    let trackInfoExtra = '';
    try {
        const gitLog = (0, fileSystem_1.execCommand)(`git log -S "${track.description}" -- conductor/index.md --format="%H | %s"`, conductorDir);
        if (gitLog) {
            const birthCommit = gitLog.split('\n')[0]; // Youngest match is the birth (or update)
            trackInfoExtra = `\n\n[HISTORY] **Track History Found:**\nOrigin commit: \`${birthCommit}\``;
        }
    }
    catch (e) { }
    return {
        success: true,
        message: `Reverted track "${track.description}" to pending state.${trackInfoExtra}`,
        data: {
            revertedTrack: track.description,
        },
    };
}
async function revertTask(conductorDir, taskName) {
    const tracksContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'index.md'));
    if (!tracksContent) {
        return {
            success: false,
            message: 'No tracks found.',
        };
    }
    const tracks = (0, markdown_1.parseTracksIndex)(tracksContent);
    const searchTerm = taskName.toLowerCase();
    for (const track of tracks) {
        const trackDir = path.join(conductorDir, track.folderPath);
        const planPath = path.join(trackDir, 'plan.md');
        if (!(0, fileSystem_1.fileExists)(planPath)) {
            continue;
        }
        const planContent = (0, fileSystem_1.readFile)(planPath);
        if (!planContent) {
            continue;
        }
        const tasks = (0, markdown_1.parsePlanTasks)(planContent);
        const matchingTask = tasks.find(t => t.description.toLowerCase().includes(searchTerm));
        if (matchingTask) {
            // --- ADVANCED GIT RECONCILIATION: Ghost Commit Detection ---
            let finalSHA = matchingTask.commitHash;
            let ghostNote = '';
            if (finalSHA) {
                try {
                    // Check if commit exists
                    const exists = (0, fileSystem_1.execCommand)(`git rev-parse --verify ${finalSHA}`, path.dirname(conductorDir));
                    if (!exists) {
                        // SHA is missing (Ghost commit)! Try to find by message
                        const searchLog = (0, fileSystem_1.execCommand)(`git log --grep="${matchingTask.description}" --format="%H" -n 1`, path.dirname(conductorDir));
                        if (searchLog && searchLog.trim()) {
                            finalSHA = searchLog.trim();
                            ghostNote = `\n[WARNING] **Ghost Commit Detected:** The original SHA \`${matchingTask.commitHash}\` was not found. Linked to latest match: \`${finalSHA}\`.`;
                        }
                    }
                }
                catch (e) { }
            }
            const updatedContent = (0, markdown_1.updateTaskStatus)(planContent, matchingTask.description, 'pending');
            (0, fileSystem_1.writeFile)(planPath, updatedContent);
            // --- ADVANCED GIT RECONCILIATION: Plan-Update Commit Detection ---
            let planCommitSHA = '';
            if (finalSHA) {
                try {
                    // Find the commit that modified plan.md after the code commit
                    const planLog = (0, fileSystem_1.execCommand)(`git log --pretty=format:"%H" -- ${planPath}`, path.dirname(conductorDir));
                    if (planLog) {
                        const shas = planLog.split('\n');
                        const codeIndex = shas.indexOf(finalSHA);
                        // If code commit is found, the plan update usually happened in the next commit (which is shas[codeIndex-1] in reverse chronological log)
                        if (codeIndex > 0) {
                            planCommitSHA = shas[codeIndex - 1];
                        }
                    }
                }
                catch (e) { }
            }
            const gitHint = finalSHA
                ? `\n\n[INFO] **Git Action Recommended:**\nRun \`git revert ${finalSHA}\`${ghostNote}${planCommitSHA ? `\n\nAlso revert the plan update: \`git revert ${planCommitSHA}\`` : ''}`
                : '';
            return {
                success: true,
                message: `Reverted task "${matchingTask.description}" in track "${track.description}"${gitHint}`,
                data: {
                    revertedTask: matchingTask.description,
                    track: track.description,
                    commitHash: finalSHA
                },
            };
        }
    }
    return {
        success: false,
        message: `No task found matching "${taskName}".`,
    };
}
