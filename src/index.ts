/**
 * Conductor - Context Engineering extension for Windsurf
 *
 * A spec-driven development framework that helps AI agents and developers
 * work together through structured tracks, plans, and quality gates.
 */

import type { CommandContext, CommandResult, SlashCommand } from './types';
import {
  setupCommand,
  implementCommand,
  statusCommand,
  newTrackCommand,
  reviewCommand,
  revertCommand,
  archiveCommand,
  registerSkillCommand,
} from './commands';
import { resolveConductorDir } from './utils/fileSystem';
import { SkillCompositionEngine, CompositeSkillRecommender } from './utils/skillComposition';
import { SkillOrchestrationEngine } from './utils/skillOrchestration';
import { SpecValidator, PlanValidator } from './utils/validators';
import { AdvancedSkillScorer, AdvancedSkillRecommender } from './utils/advancedSkillScoring';
import { SkillFeedbackLoop } from './utils/feedbackLoop';
import {
  FrontendDevelopmentProtocol,
  BackendDevelopmentProtocol,
  MobileDevelopmentProtocol,
  ProtocolFactory,
  ProjectTypeDetector
} from './utils/specializedProtocols';
import { ComplianceVerificationSystem } from './utils/complianceVerification';
import { ProjectType } from './utils/specializedProtocols';

// Export types
export * from './types';
export * from './utils/fileSystem';
export * from './utils/markdown';

// Export commands
export {
  setupCommand,
  implementCommand,
  statusCommand,
  newTrackCommand,
  reviewCommand,
  revertCommand,
  archiveCommand,
  registerSkillCommand,
};

// Export utility classes
export {
  SkillCompositionEngine,
  CompositeSkillRecommender,
  SkillOrchestrationEngine,
  SpecValidator,
  PlanValidator,
  AdvancedSkillScorer,
  AdvancedSkillRecommender,
  SkillFeedbackLoop,
  ComplianceVerificationSystem,
  FrontendDevelopmentProtocol,
  BackendDevelopmentProtocol,
  MobileDevelopmentProtocol,
  ProtocolFactory,
  ProjectTypeDetector,
  ProjectType
};

// Command registry
const commands: Map<string, SlashCommand> = new Map([
  [setupCommand.name, setupCommand],
  [implementCommand.name, implementCommand],
  [statusCommand.name, statusCommand],
  [newTrackCommand.name, newTrackCommand],
  [reviewCommand.name, reviewCommand],
  [revertCommand.name, revertCommand],
  [archiveCommand.name, archiveCommand],
  [registerSkillCommand.name, registerSkillCommand],
]);

/**
 * Execute a Conductor command
 */
export async function executeCommand(
  commandName: string,
  projectRoot: string,
  args: string[] = []
): Promise<CommandResult> {
  const command = commands.get(commandName);

  if (!command) {
    return {
      success: false,
      message: `Unknown command: ${commandName}. Available commands: ${Array.from(commands.keys()).join(', ')}`,
    };
  }

  const context: CommandContext = {
    projectRoot,
    conductorDir: resolveConductorDir(projectRoot),
    args,
  };

  return await command.execute(context, args);
}

/**
 * Get all available commands
 */
export function getAvailableCommands(): SlashCommand[] {
  return Array.from(commands.values());
}

/**
 * Get command by name
 */
export function getCommand(name: string): SlashCommand | undefined {
  return commands.get(name);
}

/**
 * Check if a command exists
 */
export function hasCommand(name: string): boolean {
  return commands.has(name);
}

/**
 * Initialize Conductor utilities
 */
export function initializeUtilities(): {
  skillCompositionEngine: SkillCompositionEngine;
  skillOrchestrationEngine: SkillOrchestrationEngine;
  advancedScorer: AdvancedSkillScorer;
  feedbackLoop: SkillFeedbackLoop;
  complianceChecker: ComplianceVerificationSystem;
} {
  const compositionEngine = new SkillCompositionEngine();
  const orchestrationEngine = new SkillOrchestrationEngine(compositionEngine);
  const advancedScorer = new AdvancedSkillScorer();
  const feedbackLoop = new SkillFeedbackLoop('./feedback.json');
  const complianceChecker = new ComplianceVerificationSystem();

  return {
    skillCompositionEngine: compositionEngine,
    skillOrchestrationEngine: orchestrationEngine,
    advancedScorer: advancedScorer,
    feedbackLoop: feedbackLoop,
    complianceChecker: complianceChecker
  };
}

// Version
export const VERSION = '1.3.2';

// Default export
export default {
  executeCommand,
  getAvailableCommands,
  getCommand,
  hasCommand,
  initializeUtilities,
  VERSION,
};