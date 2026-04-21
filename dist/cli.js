#!/usr/bin/env node
"use strict";
/**
 * Conductor CLI - Command Line Interface for Conductor
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
const commander_1 = require("commander");
const path = __importStar(require("path"));
const commands = __importStar(require("./commands"));
const index_1 = require("./index");
const program = new commander_1.Command();
program
    .name('conductor')
    .description('Conductor - Context Engineering extension for Windsurf')
    .version(index_1.VERSION);
// Register each command from the commands module
Object.values(commands).forEach((command) => {
    if (command.name && command.execute) {
        const cmd = program
            .command(`${command.name} [args...]`)
            .description(command.description || '');
        // Handle variable arguments for different commands
        cmd.action(async (...actionArgs) => {
            // Commander passes defined arguments, then (sometimes) an options object, then the command object
            // For variadic [args...], actionArgs[0] is an array of strings.
            let args = [];
            if (Array.isArray(actionArgs[0])) {
                args = actionArgs[0].filter(a => typeof a === 'string' && a.trim().length > 0);
            }
            else {
                args = actionArgs.filter(a => typeof a === 'string' && a.trim().length > 0);
            }
            const projectRoot = path.resolve(process.cwd());
            try {
                const result = await (0, index_1.executeCommand)(command.name, projectRoot, args);
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
                }
                else {
                    console.error(`\n[ERROR]: ${result.message}`);
                    process.exit(1);
                }
            }
            catch (error) {
                console.error(`\n[FATAL ERROR]: ${error instanceof Error ? error.message : String(error)}`);
                process.exit(1);
            }
        });
    }
});
// Default behavior: show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
else {
    program.parse(process.argv);
}
