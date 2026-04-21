import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const conductorDir = 'd:/specskills/conductor';

console.log(`Starting Workspace Recovery in: ${conductorDir}`);

walkDir(conductorDir, (filePath) => {
  if (filePath.endsWith('.md')) {
    try {
      // Read raw bytes to detect potential UTF-16
      const buffer = fs.readFileSync(filePath);
      
      // Determine if it was UTF-16 (starts with BOM or has many nulls)
      let content = '';
      if (buffer[0] === 0xff && buffer[1] === 0xfe) {
        console.log(`[FIX] Detected UTF-16 LE: ${filePath}`);
        content = buffer.toString('utf16le');
      } else {
        content = buffer.toString('utf-8');
      }

      // Cleanup: Remove any NULL bytes or weird chars
      const cleanContent = content.replace(/\0/g, '').trim();
      
      // Write back as strict UTF-8
      fs.writeFileSync(filePath, cleanContent, 'utf-8');
      console.log(`[OK] Normalized: ${filePath}`);
    } catch (err) {
      console.error(`[ERROR] Failed to fix ${filePath}: ${err}`);
    }
  }
});

console.log('Recovery Complete!');
