import * as path from 'path';
import { setupCommand } from '../src/commands/setup';
import { newTrackCommand } from '../src/commands/newTrack';
import { implementCommand } from '../src/commands/implement';
import { CommandContext } from '../src/types';
import { ensureDir, fileExists, readFile, deleteFile } from '../src/utils/fileSystem';

async function runTest() {
  const projectRoot = path.join(process.cwd(), 'scratch', 'test-evolution');
  const conductorDir = path.join(projectRoot, 'conductor');

  console.log('--- Phase 1: Setup (Brownfield) ---');
  // Create a fake package.json to trigger Brownfield detection
  ensureDir(projectRoot);
  // Using write_to_file equivalent via fs for testing if needed, 
  // but here we'll assume the environment is clean.
  
  const setupContext: CommandContext = {
    projectRoot,
    conductorDir,
    args: []
  };

  const setupResult = await setupCommand.execute(setupContext, []);
  console.log('Setup Result:', setupResult.message);

  console.log('\n--- Phase 2: New Track (Skill Injection) ---');
  const trackContext: CommandContext = {
    projectRoot,
    conductorDir,
    args: ['API de Pagamentos']
  };

  const trackResult = await newTrackCommand.execute(trackContext, []);
  console.log('NewTrack Result:', trackResult.message);

  if (trackResult.data) {
    const trackId = (trackResult.data as any).trackId;
    const planPath = path.join(conductorDir, 'tracks', trackId, 'plan.md');
    const planContent = readFile(planPath);

    console.log('\n--- Plan.md Verification ---');
    if (planContent?.includes('Specialized Protocols')) {
      console.log('✅ Specialized Protocols section found.');
    } else {
      console.log('❌ Specialized Protocols section MISSING.');
    }

    if (planContent?.includes('api-contract-modeling')) {
      console.log('✅ api-contract-modeling protocol injected.');
    }

    if (planContent?.match(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u)) {
      console.log('❌ Emojis found in artifacts!');
    } else {
      console.log('✅ No emojis found in artifacts.');
    }

    console.log('\n--- Phase 3: Implement (Skill Content) ---');
    const implContext: CommandContext = {
      projectRoot,
      conductorDir,
      args: ['API de Pagamentos']
    };
    const implResult = await implementCommand.execute(implContext, []);
    
    if (implResult.message.includes('Skill Protocol:')) {
      console.log('✅ Skill contents injected into implementation prompt.');
    } else {
      console.log('❌ Skill content injection failed.');
    }
  }
}

runTest().catch(console.error);
