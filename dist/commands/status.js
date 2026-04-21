"use strict";
/**
 * Status command - Displays current project progress
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
exports.statusCommand = void 0;
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
const markdown_1 = require("../utils/markdown");
exports.statusCommand = {
    name: 'status',
    description: 'Displays the current progress of the project',
    execute: async (context) => {
        try {
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
            // Verify setup
            const requiredFiles = ['index.md', 'product.md', 'tech-stack.md', 'workflow.md'];
            const missingFiles = requiredFiles.filter(f => !(0, fileSystem_1.fileExists)(path.join(conductorDir, f)));
            if (missingFiles.length > 0) {
                return {
                    success: false,
                    message: '[SKIP] Conductor is not set up. Please run /setup.',
                };
            }
            // Read tracks index
            const tracksContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'index.md'));
            if (!tracksContent) {
                return {
                    success: false,
                    message: '[ERROR] Could not read tracks index.',
                };
            }
            const tracks = (0, markdown_1.parseTracksIndex)(tracksContent);
            // Gather detailed status for each track
            const trackStatuses = await Promise.all(tracks.map(async (track) => {
                const trackDir = path.join(conductorDir, track.folderPath);
                const planPath = path.join(trackDir, 'plan.md');
                let taskStats = { total: 0, completed: 0, inProgress: 0, pending: 0 };
                if ((0, fileSystem_1.fileExists)(planPath)) {
                    const planContent = (0, fileSystem_1.readFile)(planPath);
                    if (planContent) {
                        const tasks = (0, markdown_1.parsePlanTasks)(planContent);
                        taskStats = (0, markdown_1.countTasksByStatus)(tasks);
                    }
                }
                return {
                    description: track.description,
                    status: track.status,
                    taskStats,
                };
            }));
            // Calculate overall progress
            const totalTasks = trackStatuses.reduce((sum, t) => sum + t.taskStats.total, 0);
            const completedTasks = trackStatuses.reduce((sum, t) => sum + t.taskStats.completed, 0);
            const inProgressTasks = trackStatuses.reduce((sum, t) => sum + t.taskStats.inProgress, 0);
            const progressPercent = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;
            // Find current active track
            const activeTrack = trackStatuses.find(t => t.status === 'in_progress');
            const nextPendingTrack = trackStatuses.find(t => t.status === 'pending');
            // Generate status report
            const timestamp = new Date().toLocaleString('pt-BR');
            let report = `[STATUS] **Conductor Status Report**\n`;
            report += `[DATE] **Generated:** ${timestamp}\n\n`;
            report += `## [PROGRESS] Overall Progress\n`;
            report += `${(0, markdown_1.renderProgressBar)(progressPercent, 30)}\n\n`;
            report += `- **Total Tracks:** ${tracks.length}\n`;
            report += `- **Total Tasks:** ${totalTasks}\n`;
            report += `- **Completed:** [x] ${completedTasks}\n`;
            report += `- **In Progress:** [~] ${inProgressTasks}\n`;
            report += `- **Pending:** [ ] ${totalTasks - completedTasks - inProgressTasks}\n\n`;
            report += `---\n\n`;
            if (activeTrack) {
                report += `## [ACTIVE] Current Active Track\n`;
                report += `**${activeTrack.description}**\n`;
                const activePercent = activeTrack.taskStats.total > 0
                    ? Math.round((activeTrack.taskStats.completed / activeTrack.taskStats.total) * 100)
                    : 0;
                report += `${(0, markdown_1.renderProgressBar)(activePercent, 20)} (${activeTrack.taskStats.completed}/${activeTrack.taskStats.total} tasks)\n\n`;
            }
            if (nextPendingTrack && !activeTrack) {
                report += `## [NEXT] Next Action\n`;
                report += `Ready to start: **${nextPendingTrack.description}**\n\n`;
            }
            if (trackStatuses.length > 0) {
                report += `## [LIST] Track Breakdown\n`;
                for (const track of trackStatuses) {
                    const statusIcon = track.status === 'completed' ? '[x]' :
                        track.status === 'in_progress' ? '[~]' : '[ ]';
                    report += `${statusIcon} **${track.description}** `;
                    if (track.taskStats.total > 0) {
                        report += `(${track.taskStats.completed}/${track.taskStats.total})`;
                    }
                    report += `\n`;
                }
            }
            return {
                success: true,
                message: report,
                data: {
                    tracks: trackStatuses,
                    overallProgress: progressPercent,
                    activeTrack: activeTrack?.description,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Status check failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
};
