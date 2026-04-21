import * as fs from 'fs';
import * as path from 'path';
import { parseTracksIndex } from '../utils/markdown';

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

  const tracks = parseTracksIndex(content);
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
