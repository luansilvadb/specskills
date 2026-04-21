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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const markdown_1 = require("../utils/markdown");
/**
 * Migrates Conductor registry from table/list format to Separator format (---)
 */
async function migrateRegistry() {
    const indexPath = path.join(process.cwd(), 'conductor', 'index.md');
    if (!fs.existsSync(indexPath)) {
        console.error('index.md not found at', indexPath);
        return;
    }
    const content = fs.readFileSync(indexPath, 'utf-8');
    // Skip if already migrated
    if (content.includes('\n---\n- [')) {
        console.log('Registry already in high-fidelity format.');
        return;
    }
    const tracks = (0, markdown_1.parseTracksIndex)(content);
    if (tracks.length === 0) {
        console.log('No tracks found to migrate. Check your index.md format.');
        return;
    }
    console.log(`Found ${tracks.length} tracks to migrate.`);
    let newContent = '# Tracks Registry\n\n';
    newContent += 'This file tracks all major tracks using high-fidelity separators.\n\n';
    for (const track of tracks) {
        const statusChar = track.status === 'completed' ? 'x' :
            track.status === 'in_progress' ? '~' : ' ';
        newContent += '---\n';
        newContent += `- [${statusChar}] **Track: ${track.description}**\n`;
        newContent += `*Link: [${track.description}](${track.folderPath})*\n`;
        newContent += `*Status: ${track.status}*\n`;
        if (track.metadata) {
            for (const [key, value] of Object.entries(track.metadata)) {
                newContent += `*${key}: ${value}*\n`;
            }
        }
        newContent += '\n';
    }
    newContent += '---\n\n## How to Use\n\n';
    newContent += '1. **Create New Track**: `/newTrack <description>`\n';
    newContent += '2. **Implement Task**: `/implement <track-id>`\n';
    newContent += '3. **Review Quality**: `/review`\n';
    newContent += '4. **View Status**: `/status`\n';
    fs.writeFileSync(indexPath, newContent);
    console.log('Migration complete!');
}
migrateRegistry().catch(console.error);
