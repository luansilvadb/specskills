/**
 * Track Cleanup System
 * Implements the track cleanup protocol as defined in the Conductor TOML specifications
 */
import type { CommandContext, CommandResult, Track } from '../types';
export declare enum CleanupAction {
    ARCHIVE = "archive",
    DELETE = "delete",
    KEEP = "keep",
    REVIEW = "review"
}
export interface CleanupOptions {
    action: CleanupAction;
    archiveLocation?: string;
    trackId: string;
}
export declare class TrackCleanupProtocol {
    /**
     * Execute the cleanup action for a completed track
     */
    static executeCleanup(context: CommandContext, options: CleanupOptions): Promise<CommandResult>;
    /**
     * Archive a track to the archive directory
     */
    private static archiveTrack;
    /**
     * Delete a track permanently
     */
    private static deleteTrack;
    /**
     * Generate cleanup recommendations based on track characteristics
     */
    static generateRecommendations(_track: Track): CleanupAction;
    /**
     * Update the index.md file to reflect track status change
     */
    static updateTracksIndex(context: CommandContext, trackId: string, action: CleanupAction): Promise<CommandResult>;
}
