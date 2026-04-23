#!/usr/bin/env node

/**
 * Multi-Platform Installation Script for Conductor
 * Allows users to select their preferred platform during installation
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Platform configuration
const platformConfig = require('./platform-config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Welcome to Conductor - Multi-Platform Installation');
console.log('');
console.log('Available platforms:');
Object.keys(platformConfig.platforms).forEach((key, index) => {
  const platform = platformConfig.platforms[key];
  console.log(`${index + 1}. ${platform.name} - ${platform.description}`);
});
console.log('');

function askPlatform() {
  rl.question('Select your platform (1-' + Object.keys(platformConfig.platforms).length + ') or press Enter for default (' + platformConfig.defaultPlatform + '): ', (answer) => {
    let selectedPlatform;

    if (answer.trim() === '') {
      selectedPlatform = platformConfig.defaultPlatform;
    } else {
      const platformIndex = parseInt(answer) - 1;
      const platformKeys = Object.keys(platformConfig.platforms);

      if (platformIndex >= 0 && platformIndex < platformKeys.length) {
        selectedPlatform = platformKeys[platformIndex];
      } else {
        console.log('❌ Invalid selection. Using default platform.');
        selectedPlatform = platformConfig.defaultPlatform;
      }
    }

    console.log(`\n📦 Installing for ${platformConfig.platforms[selectedPlatform].name}...\n`);

    // Create necessary directories
    const installDir = platformConfig.platforms[selectedPlatform].installationDir;
    if (installDir && !fs.existsSync(installDir)) {
      fs.mkdirSync(installDir, { recursive: true });
      console.log(`✅ Created directory: ${installDir}`);
    }

    // Copy platform-specific files
    const filesToCopy = platformConfig.platforms[selectedPlatform].files;

    // For demonstration purposes, we'll create sample files
    // In a real scenario, you would copy actual files from a source
    filesToCopy.forEach(filePattern => {
      const dirPath = path.dirname(filePattern);
      if (dirPath !== '.') {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`✅ Created directory: ${dirPath}`);
        }
      }

      // Create a sample file (in a real scenario, copy from source)
      if (!filePattern.endsWith('/')) {
        const sampleContent = `# ${selectedPlatform} Platform Configuration\n\nThis file was configured for ${platformConfig.platforms[selectedPlatform].name} platform.\n`;
        fs.writeFileSync(filePattern, sampleContent);
        console.log(`✅ Created file: ${filePattern}`);
      }
    });

    console.log(`\n🎉 Installation complete for ${platformConfig.platforms[selectedPlatform].name}!`);
    console.log(`📁 Platform files installed in: ${installDir}`);
    console.log(`\n🚀 You can now use Conductor commands in your selected platform.`);

    rl.close();
  });
}

askPlatform();