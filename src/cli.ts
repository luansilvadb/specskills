#!/usr/bin/env node
/**
 * Conductor CLI - Command Line Interface for Conductor
 */

import { Command } from 'commander';
import * as path from 'path';
import * as commands from './commands';
import { executeCommand, VERSION } from './index';

const program = new Command();

program
  .name('conductor')
  .description('Conductor - Context Engineering extension for Windsurf')
  .version(VERSION);

// Register each command from the commands module
Object.values(commands).forEach((command: any) => {
  if (command.name && command.execute) {
    const cmd = program
      .command(`${command.name} [args...]`)
      .description(command.description || '');

    // Handle variable arguments for different commands
    cmd.action(async (...actionArgs: any[]) => {
      // Commander passes defined arguments, then (sometimes) an options object, then the command object
      // For variadic [args...], actionArgs[0] is an array of strings.
      let args: string[] = [];
      if (Array.isArray(actionArgs[0])) {
        args = actionArgs[0].filter(a => typeof a === 'string' && a.trim().length > 0);
      } else {
        args = actionArgs.filter(a => typeof a === 'string' && a.trim().length > 0);
      }
      const projectRoot = path.resolve(process.cwd());

      try {
        const result = await executeCommand(command.name, projectRoot, args);
        
        if (result.success) {
          console.log(result.message);
          
          // Handle interactive questions if present
          if (result.questions && result.questions.length > 0) {
            console.log('\n--- Conductor requires more information ---');
            console.log('This command requires interactive input. In the current CLI version, please');
            console.log('provide these details in your product.md or as arguments if supported.');
            result.questions.forEach(q => {
              console.log(`\n[${q.header}]`);
              console.log(`${q.question}`);
              if (q.options) {
                console.log('Options: ' + q.options.map(o => o.label).join(', '));
              }
            });
          }
        } else {
          console.error(`\n[ERROR]: ${result.message}`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`\n[FATAL ERROR]: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
      }
    });
  }
});

// Default behavior: show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
