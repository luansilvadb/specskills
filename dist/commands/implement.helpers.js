"use strict";
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
exports.validateProjectSetup = validateProjectSetup;
exports.readAndParseTracks = readAndParseTracks;
exports.selectTrack = selectTrack;
exports.validateTrackStructure = validateTrackStructure;
exports.readAndParseTrackPlan = readAndParseTrackPlan;
exports.updateTrackStatusInIndex = updateTrackStatusInIndex;
exports.handleTrackCompletion = handleTrackCompletion;
const path = __importStar(require("path"));
const fileSystem_1 = require("../utils/fileSystem");
const markdown_1 = require("../utils/markdown");
const skills_1 = require("../utils/skills");
const DEFAULT_NO_TRACKS_MESSAGE = 'The tracks file is empty or malformed. No tracks to implement.';
// Helper function to validate project setup
function validateProjectSetup(conductorDir) {
    const requiredFiles = ['product.md', 'tech-stack.md', 'workflow.md'];
    const missingFiles = requiredFiles.filter(f => !(0, fileSystem_1.fileExists)(path.join(conductorDir, f)));
    if (missingFiles.length > 0) {
        return {
            success: false,
            message: '[SKIP] Conductor is not set up. Please run /setup.',
        };
    }
    return null;
}
// Helper function to read and parse tracks
function readAndParseTracks(conductorDir, noTracksMessage = DEFAULT_NO_TRACKS_MESSAGE) {
    const tracksContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'index.md'));
    if (!tracksContent) {
        return {
            tracks: [],
            result: {
                success: false,
                message: 'No tracks found. Create a track first with /newTrack.',
            }
        };
    }
    const tracks = (0, markdown_1.parseTracksIndex)(tracksContent);
    if (tracks.length === 0) {
        return {
            tracks: [],
            result: {
                success: false,
                message: noTracksMessage,
            }
        };
    }
    return { tracks, result: null };
}
// Helper function to select a track based on arguments or automatic selection
function selectTrack(tracks, contextArgs) {
    const trackDescription = contextArgs.join(' ').trim();
    if (trackDescription) {
        return handleExplicitTrackSelection(tracks, trackDescription);
    }
    return handleAutomaticTrackSelection(tracks);
}
/**
 * Handle track selection when an explicit description is provided
 */
function handleExplicitTrackSelection(tracks, trackDescription) {
    const searchTerm = trackDescription.toLowerCase();
    const matches = tracks.filter(t => t.description.toLowerCase().includes(searchTerm) ||
        t.folderPath.toLowerCase().includes(searchTerm));
    if (matches.length === 0) {
        return {
            selectedTrack: null,
            result: {
                success: false,
                message: `[ERROR] No track found matching "${trackDescription}".`,
            },
        };
    }
    if (matches.length === 1) {
        return { selectedTrack: matches[0], result: null };
    }
    const exactMatch = matches.find((t) => t.description.toLowerCase() === searchTerm);
    if (exactMatch) {
        return { selectedTrack: exactMatch, result: null };
    }
    return {
        selectedTrack: null,
        result: {
            success: false,
            message: `[WARNING] Multiple tracks match "${trackDescription}":\n${matches.map((m) => `- ${m.description}`).join('\n')}\n\nPlease be more specific.`,
        },
    };
}
/**
 * Handle automatic track selection when no explicit description is provided
 */
function handleAutomaticTrackSelection(tracks) {
    const selectedTrack = tracks.find((t) => t.status === 'in_progress') ||
        tracks.find((t) => t.status === 'pending') ||
        null;
    if (!selectedTrack) {
        return {
            selectedTrack: null,
            result: {
                success: true,
                message: '[SUCCESS] All tracks are completed! Use /newTrack to start something new.',
            },
        };
    }
    return {
        selectedTrack,
        result: {
            success: true,
            message: `[CONFIRMATION] About to implement: **${selectedTrack.description}**\n\nDo you want to proceed with this track?`,
            questions: [
                {
                    header: 'Confirm Implementation',
                    question: `Implement track: "${selectedTrack.description}"?`,
                    type: 'choice',
                    options: [
                        { label: 'Yes, proceed', description: 'Start implementing the selected track' },
                        { label: 'No, select another', description: 'Return to track selection' },
                    ],
                },
            ],
            data: {
                trackId: selectedTrack.folderPath,
                confirmProceed: true,
            },
        },
    };
}
// Helper function to validate track structure
function validateTrackStructure(trackDir, selectedTrack) {
    // Validate: project code should NOT be inside track directory
    const misplacedProjectDir = path.join(trackDir, 'project');
    if ((0, fileSystem_1.fileExists)(misplacedProjectDir)) {
        const trackId = path.basename(selectedTrack.folderPath);
        return {
            success: false,
            message: `[WARNING] Estrutura incorreta detectada!\n\nCódigo do projeto encontrado em: ${misplacedProjectDir}\n\nCorreção necessária:\n- Artefatos da track (spec.md, plan.md) → ficam em ${trackDir}\n- Código do projeto → deve estar fora do conductor (ex: projects/${trackId}/)\n\nMova o conteúdo de 'project/' para fora do conductor e remova essa pasta.`,
        };
    }
    return null;
}
// Helper function to read and parse track plan
function readAndParseTrackPlan(trackDir, selectedTrack, conductorDir) {
    const planPath = path.join(trackDir, 'plan.md');
    if (!(0, fileSystem_1.fileExists)(planPath)) {
        return {
            planContent: null,
            activeSkills: [],
            tasks: [],
            result: {
                success: false,
                message: `Plan not found for track "${selectedTrack.description}".`,
            }
        };
    }
    const planContent = (0, fileSystem_1.readFile)(planPath);
    if (!planContent) {
        return {
            planContent: null,
            activeSkills: [],
            tasks: [],
            result: {
                success: false,
                message: 'Could not read plan file.',
            }
        };
    }
    // Check for active skills (Option B: Global Scan)
    const allSkills = (0, skills_1.loadAllSkills)(path.join(conductorDir, 'skills'));
    const activeSkills = (0, skills_1.findActiveSkills)(planContent, allSkills);
    // Parse tasks
    const tasks = (0, markdown_1.parsePlanTasks)(planContent);
    return { planContent, activeSkills, tasks, result: null };
}
// Helper function to update track status in the main index.md file
async function updateTrackStatusInIndex(conductorDir, trackDescription, newStatus) {
    const indexPath = path.join(conductorDir, 'index.md');
    const content = (0, fileSystem_1.readFile)(indexPath);
    if (!content) {
        console.error(`Index file not found at ${indexPath}`);
        return;
    }
    // Determine the status character to use
    const statusChar = newStatus === 'completed' ? 'x' :
        newStatus === 'in_progress' ? '~' : ' ';
    // Escape special regex characters in the track description
    const escapedDescription = trackDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Pattern to match the format: - [ ] **Track: description**
    // We need to account for the colon and space after 'Track'
    const pattern = new RegExp(`(-\\s*\\[)(?:\\s|~|x)(\\]\\s*\\*\\*Track:\\s*${escapedDescription}\\*\\*)`, 'g');
    // Replace the status character in the matched pattern
    const updatedContent = content.replace(pattern, `$1${statusChar}$2`);
    if (updatedContent !== content) {
        (0, fileSystem_1.writeFile)(indexPath, updatedContent);
    }
}
// Helper function to handle track completion logic
function handleTrackCompletion(selectedTrack, tasks) {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const currentTask = tasks.find(t => t.status === 'in_progress');
    // Completion Logic (Protocol 4.0 & 5.0)
    if (pendingTasks.length === 0 && !currentTask) {
        return {
            completed: true,
            result: {
                success: true,
                message: `[SUCCESS] **Track Implementation Complete**\n\nI will now initiate the **Synchronization Protocol (4.0)** and **Cleanup (5.0)**.\n\n**O Agente deve agora:**\n1. Comparar as alterações implementadas com o \`spec.md\`.\n2. Propor atualizações para \`product.md\`, \`tech-stack.md\` e \`product-guidelines.md\`.\n3. Após aprovação, atualizar o \`index.md\` e decidir o destino desta track.`,
                questions: [
                    {
                        header: "Sync Docs",
                        question: "Should I analyze the specification and propose updates to `product.md` and `tech-stack.md`?",
                        type: "yesno"
                    },
                    {
                        header: "Cleanup",
                        question: "What should I do with this track folder?",
                        type: "choice",
                        options: [
                            { label: "Archive", description: "Move to conductor/archive/" },
                            { label: "Delete", description: "Permanently remove track" },
                            { label: "Keep", description: "Leave it in the tracks list" }
                        ]
                    }
                ],
                data: {
                    trackId: path.basename(selectedTrack.folderPath),
                    canSync: true,
                    protocol: '4.0',
                    syncAction: 'analyze_docs'
                }
            }
        };
    }
    return { completed: false, result: null };
}
