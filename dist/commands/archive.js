"use strict";
/**
 * Archive command - Moves completed tracks to archive
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
exports.archiveCommand = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fileSystem_1 = require("../utils/fileSystem");
exports.archiveCommand = {
    name: 'archive',
    description: 'Archives a completed track',
    execute: async (context) => {
        try {
            const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
            // Verify setup
            if (!(0, fileSystem_1.fileExists)(conductorDir)) {
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
        }
        catch (error) {
            return {
                success: false,
                message: `Archive failed: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    },
};
function parseTracksTable(content) {
    const tracks = [];
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
async function archiveTrack(conductorDir, trackId) {
    const tracksContent = (0, fileSystem_1.readFile)(path.join(conductorDir, 'tracks', 'index.md'));
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
    (0, fileSystem_1.ensureDir)(archiveDir);
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
    const updatedContent = tracksContent.replace(new RegExp(`\\| ${trackId} \\|`, 'g'), `| ~~${trackId}~~ |`);
    (0, fileSystem_1.writeFile)(path.join(tracksDir, 'index.md'), updatedContent);
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
