/**
 * Archive command - Moves completed tracks to archive
 */

import * as path from 'path';
import * as fs from 'fs';
import type { CommandContext, CommandResult, SlashCommand } from '../types';
import {
  fileExists,
  readFile,
  writeFile,
  resolveConductorDir,
  ensureDir,
} from '../utils/fileSystem';

export const archiveCommand: SlashCommand = {
  name: 'archive',
  description: 'Archives a completed track',
  execute: async (context: CommandContext): Promise<CommandResult> => {
    try {
      const conductorDir = resolveConductorDir(context.projectRoot);

      // Verify setup
      if (!fileExists(conductorDir)) {
        return {
          success: false,
          message: 'Conductor is not set up. Please run /setup first.',
        };
      }

      // Parse arguments
      const args = context.args;
      const trackId = args[0];

      if (!trackId) {
        return {
          success: false,
          message: 'Please provide a track ID to archive. Usage: /archive <track-id>',
        };
      }

      return await archiveTrack(conductorDir, trackId);
    } catch (error) {
      return {
        success: false,
        message: `Archive failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
};

interface TrackFromTable {
  id: string;
  description: string;
  status: string;
}

function parseTracksTable(content: string): TrackFromTable[] {
  const tracks: TrackFromTable[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Match table row: | id | description | status | date |
    const match = line.match(/^\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    if (match && !line.includes('----') && !line.includes('ID')) {
      const id = match[1].trim();
      const description = match[2].trim();
      const status = match[3].trim();
      tracks.push({ id, description, status });
    }
  }

  return tracks;
}

async function archiveTrack(conductorDir: string, trackId: string): Promise<CommandResult> {
  const tracksContent = readFile(path.join(conductorDir, 'tracks', 'index.md'));
  if (!tracksContent) {
    return {
      success: false,
      message: 'No tracks found.',
    };
  }

  const tracks = parseTracksTable(tracksContent);
  const track = tracks.find(t => t.id === trackId);

  if (!track) {
    return {
      success: false,
      message: `No track found with ID "${trackId}".`,
    };
  }

  // Check if track is completed - look for status containing "Concluído" or completed emoji
  const isCompleted = track.status.includes('Concluído') ||
                      track.status.includes('complete') ||
                      track.status.toLowerCase().includes('completed');

  if (!isCompleted) {
    return {
      success: false,
      message: `Track "${trackId}" is not completed (status: ${track.status}). Only completed tracks can be archived.`,
    };
  }

  // Define paths
  const tracksDir = path.join(conductorDir, 'tracks');
  const archiveDir = path.join(conductorDir, 'archive');
  const sourcePath = path.join(tracksDir, trackId);
  const destPath = path.join(archiveDir, trackId);

  // Verify source exists
  if (!fs.existsSync(sourcePath)) {
    return {
      success: false,
      message: `Track folder not found: ${sourcePath}`,
    };
  }

  // Ensure archive directory exists
  ensureDir(archiveDir);

  // Check if already archived
  if (fs.existsSync(destPath)) {
    return {
      success: false,
      message: `Track "${trackId}" already exists in archive.`,
    };
  }

  // Move the track folder
  fs.renameSync(sourcePath, destPath);

  // Update tracks index to mark as archived
  const updatedContent = tracksContent.replace(
    new RegExp(`\\| ${trackId} \\|`, 'g'),
    `| ~~${trackId}~~ |`
  );
  writeFile(path.join(tracksDir, 'index.md'), updatedContent);

  return {
    success: true,
    message: `[SUCCESS] **Lifecycle Point Reached**: Track "${trackId}" (${track.description}) has been preserved in the archive.\n\n> The tracks registry and the workspace state have been updated to reflect the completion of this cycle.`,
    data: {
      archivedTrack: trackId,
      description: track.description,
      sourcePath,
      destPath,
    },
  };
}
