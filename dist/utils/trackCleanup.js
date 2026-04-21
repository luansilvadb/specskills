"use strict";
/**
 * Track Cleanup System
 * Implements the track cleanup protocol as defined in the Conductor TOML specifications
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
exports.TrackCleanupProtocol = exports.CleanupAction = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fileSystem_1 = require("./fileSystem");
var CleanupAction;
(function (CleanupAction) {
    CleanupAction["ARCHIVE"] = "archive";
    CleanupAction["DELETE"] = "delete";
    CleanupAction["KEEP"] = "keep";
    CleanupAction["REVIEW"] = "review";
})(CleanupAction || (exports.CleanupAction = CleanupAction = {}));
class TrackCleanupProtocol {
    /**
     * Execute the cleanup action for a completed track
     */
    static async executeCleanup(context, options) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        const trackDir = path.join(conductorDir, 'tracks', options.trackId);
        if (!(0, fileSystem_1.fileExists)(trackDir)) {
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
        }
        catch (error) {
            return {
                success: false,
                message: `Cleanup operation failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Archive a track to the archive directory
     */
    static async archiveTrack(context, trackId, archiveLocation) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
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
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to archive track: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Delete a track permanently
     */
    static async deleteTrack(context, trackId) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        const trackDir = path.join(conductorDir, 'tracks', trackId);
        try {
            // Remove the track directory and all its contents
            fs.rmSync(trackDir, { recursive: true, force: true });
            return {
                success: true,
                message: `Track '${trackId}' deleted permanently`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to delete track: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Generate cleanup recommendations based on track characteristics
     */
    static generateRecommendations(_track) {
        // For now, we'll use simple heuristics
        // In a real implementation, this would analyze the track's content, size, importance, etc.
        // Default recommendation: archive important tracks, delete temporary ones
        // For MVP, we'll suggest archiving as the safest option
        return CleanupAction.ARCHIVE;
    }
    /**
     * Update the index.md file to reflect track status change
     */
    static async updateTracksIndex(context, trackId, action) {
        const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
        const indexPath = path.join(conductorDir, 'index.md');
        if (!(0, fileSystem_1.fileExists)(indexPath)) {
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
                content = content.replace(new RegExp(`^(.*${trackId}.*?)\\[x\\](.*)$`, 'm'), '$1[~]$2 (archived)');
            }
            else if (action === CleanupAction.DELETE) {
                // Comment out or mark for removal (we'll mark with a note)
                content = content.replace(new RegExp(`^.*${trackId}.*$`, 'm'), (match) => `<!-- REMOVED: ${match.trim()} -->`);
            }
            fs.writeFileSync(indexPath, content);
            return {
                success: true,
                message: 'Tracks index updated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to update tracks index: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
}
exports.TrackCleanupProtocol = TrackCleanupProtocol;
