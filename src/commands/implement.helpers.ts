import * as path from 'path';
import type { CommandResult } from '../types';
import {
  fileExists,
  readFile,
  writeFile,
} from '../utils/fileSystem';
import { parseTracksIndex, parsePlanTasks } from '../utils/markdown';
import { loadAllSkills, findActiveSkills } from '../utils/skills';

const DEFAULT_NO_TRACKS_MESSAGE =
  'The tracks file is empty or malformed. No tracks to implement.';

// Helper function to validate project setup
export function validateProjectSetup(conductorDir: string): CommandResult | null {
  const requiredFiles = ['product.md', 'tech-stack.md', 'workflow.md'];
  const missingFiles = requiredFiles.filter(f => !fileExists(path.join(conductorDir, f)));

  if (missingFiles.length > 0) {
    return {
      success: false,
      message: '[SKIP] Conductor is not set up. Please run /setup.',
    };
  }

  return null;
}

// Helper function to read and parse tracks
export function readAndParseTracks(
  conductorDir: string,
  noTracksMessage: string = DEFAULT_NO_TRACKS_MESSAGE
): { tracks: any[]; result: CommandResult | null } {
  const tracksContent = readFile(path.join(conductorDir, 'index.md'));
  if (!tracksContent) {
    return {
      tracks: [],
      result: {
        success: false,
        message: 'No tracks found. Create a track first with /newTrack.',
      }
    };
  }

  const tracks = parseTracksIndex(tracksContent);
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
export function selectTrack(
  tracks: any[],
  contextArgs: string[]
): { selectedTrack: any | null; result: CommandResult | null } {
  const trackDescription = contextArgs.join(' ').trim();
  if (trackDescription) {
    return handleExplicitTrackSelection(tracks, trackDescription);
  }
  return handleAutomaticTrackSelection(tracks);
}

/**
 * Handle track selection when an explicit description is provided
 */
function handleExplicitTrackSelection(
  tracks: any[],
  trackDescription: string
): { selectedTrack: any | null; result: CommandResult | null } {
  const searchTerm = trackDescription.toLowerCase();
  const matches = tracks.filter(
    t =>
      t.description.toLowerCase().includes(searchTerm) ||
      t.folderPath.toLowerCase().includes(searchTerm)
  );

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

  const exactMatch = matches.find((t: any) => t.description.toLowerCase() === searchTerm);
  if (exactMatch) {
    return { selectedTrack: exactMatch, result: null };
  }

  return {
    selectedTrack: null,
    result: {
      success: false,
      message: `[WARNING] Multiple tracks match "${trackDescription}":\n${matches.map((m: any) => `- ${m.description}`).join('\n')}\n\nPlease be more specific.`,
    },
  };
}

/**
 * Handle automatic track selection when no explicit description is provided
 */
function handleAutomaticTrackSelection(
  tracks: any[]
): { selectedTrack: any | null; result: CommandResult | null } {
  const selectedTrack =
    tracks.find((t: any) => t.status === 'in_progress') ||
    tracks.find((t: any) => t.status === 'pending') ||
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
export function validateTrackStructure(trackDir: string, selectedTrack: {folderPath: string, description: string}): CommandResult | null {
  // Validate: project code should NOT be inside track directory
  const misplacedProjectDir = path.join(trackDir, 'project');
  if (fileExists(misplacedProjectDir)) {
    const trackId = path.basename(selectedTrack.folderPath);
    return {
      success: false,
      message: `[WARNING] Estrutura incorreta detectada!\n\nCódigo do projeto encontrado em: ${misplacedProjectDir}\n\nCorreção necessária:\n- Artefatos da track (spec.md, plan.md) → ficam em ${trackDir}\n- Código do projeto → deve estar fora do conductor (ex: projects/${trackId}/)\n\nMova o conteúdo de 'project/' para fora do conductor e remova essa pasta.`,
    };
  }

  return null;
}

// Helper function to read and parse track plan
export function readAndParseTrackPlan(trackDir: string, selectedTrack: any, conductorDir: string): { planContent: string | null, activeSkills: any[], tasks: any[], result: CommandResult | null } {
  const planPath = path.join(trackDir, 'plan.md');

  if (!fileExists(planPath)) {
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

  const planContent = readFile(planPath);
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
  const allSkills = loadAllSkills(path.join(conductorDir, 'skills'));
  const activeSkills = findActiveSkills(planContent, allSkills);

  // Parse tasks
  const tasks = parsePlanTasks(planContent);

  return { planContent, activeSkills, tasks, result: null };
}

// Helper function to update track status in the main index.md file
export async function updateTrackStatusInIndex(conductorDir: string, trackDescription: string, newStatus: 'pending' | 'in_progress' | 'completed'): Promise<void> {
  const indexPath = path.join(conductorDir, 'index.md');
  const content = readFile(indexPath);

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
  const pattern = new RegExp(
    `(-\\s*\\[)(?:\\s|~|x)(\\]\\s*\\*\\*Track:\\s*${escapedDescription}\\*\\*)`,
    'g'
  );

  // Replace the status character in the matched pattern
  const updatedContent = content.replace(pattern, `$1${statusChar}$2`);

  if (updatedContent !== content) {
    writeFile(indexPath, updatedContent);
  }
}

// Helper function to handle track completion logic
export function handleTrackCompletion(selectedTrack: any, tasks: any[]): { completed: boolean, result: CommandResult | null } {
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
