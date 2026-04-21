/**
 * Track Cleanup System
 * Implements the track cleanup protocol as defined in the Conductor TOML specifications
 */

import * as path from 'path';
import * as fs from 'fs';
import type { CommandContext, CommandResult, Track } from '../types';
import { fileExists, resolveConductorDir } from './fileSystem';

export enum CleanupAction {
  ARCHIVE = 'archive',
  DELETE = 'delete',
  KEEP = 'keep',
  REVIEW = 'review'
}

export interface CleanupOptions {
  action: CleanupAction;
  archiveLocation?: string;
  trackId: string;
}

export class TrackCleanupProtocol {
  /**
   * Execute the cleanup action for a completed track
   */
  static async executeCleanup(context: CommandContext, options: CleanupOptions): Promise<CommandResult> {
    const conductorDir = resolveConductorDir(context.projectRoot);
    const trackDir = path.join(conductorDir, 'tracks', options.trackId);

    if (!fileExists(trackDir)) {
      return {
        success: false,
        message: `Track directory does not exist: ${trackDir}`
      };
    }

    try {
      switch (options.action) {
        case CleanupAction.ARCHIVE:
          return await this.archiveTrack(context, options.trackId, options.archiveLocation);

        case CleanupAction.DELETE:
          return await this.deleteTrack(context, options.trackId);

        case CleanupAction.KEEP:
          return {
            success: true,
            message: `Track '${options.trackId}' kept in tracks directory`
          };

        case CleanupAction.REVIEW:
          return {
            success: true,
            message: `Track '${options.trackId}' marked for review. No changes made.`
          };

        default:
          return {
            success: false,
            message: `Unknown cleanup action: ${options.action}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Cleanup operation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Archive a track to the archive directory
   */
  private static async archiveTrack(context: CommandContext, trackId: string, archiveLocation?: string): Promise<CommandResult> {
    const conductorDir = resolveConductorDir(context.projectRoot);
    const sourceDir = path.join(conductorDir, 'tracks', trackId);

    // Determine archive location
    const archiveDir = archiveLocation || path.join(conductorDir, 'archive');

    // Create archive directory if it doesn't exist
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const destDir = path.join(archiveDir, trackId);

    try {
      // Move the track directory to archive
      fs.renameSync(sourceDir, destDir);

      return {
        success: true,
        message: `Track '${trackId}' archived to: ${destDir}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to archive track: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Delete a track permanently
   */
  private static async deleteTrack(context: CommandContext, trackId: string): Promise<CommandResult> {
    const conductorDir = resolveConductorDir(context.projectRoot);
    const trackDir = path.join(conductorDir, 'tracks', trackId);

    try {
      // Remove the track directory and all its contents
      fs.rmSync(trackDir, { recursive: true, force: true });

      return {
        success: true,
        message: `Track '${trackId}' deleted permanently`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete track: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Generate cleanup recommendations based on track characteristics
   */
  static generateRecommendations(_track: Track): CleanupAction {
    // For now, we'll use simple heuristics
    // In a real implementation, this would analyze the track's content, size, importance, etc.

    // Default recommendation: archive important tracks, delete temporary ones
    // For MVP, we'll suggest archiving as the safest option
    return CleanupAction.ARCHIVE;
  }

  /**
   * Update the index.md file to reflect track status change
   */
  static async updateTracksIndex(context: CommandContext, trackId: string, action: CleanupAction): Promise<CommandResult> {
    const conductorDir = resolveConductorDir(context.projectRoot);
    const indexPath = path.join(conductorDir, 'index.md');

    if (!fileExists(indexPath)) {
      return {
        success: false,
        message: 'Tracks index file not found'
      };
    }

    try {
      let content = fs.readFileSync(indexPath, 'utf-8');

      // Update the track status in the index based on the cleanup action
      if (action === CleanupAction.ARCHIVE) {
        // Replace [x] with [~] to indicate archived status
        content = content.replace(
          new RegExp(`^(.*${trackId}.*?)\\[x\\](.*)$`, 'm'),
          '$1[~]$2 (archived)'
        );
      } else if (action === CleanupAction.DELETE) {
        // Comment out or mark for removal (we'll mark with a note)
        content = content.replace(
          new RegExp(`^.*${trackId}.*$`, 'm'),
          (match) => `<!-- REMOVED: ${match.trim()} -->`
        );
      }

      fs.writeFileSync(indexPath, content);

      return {
        success: true,
        message: 'Tracks index updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update tracks index: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}