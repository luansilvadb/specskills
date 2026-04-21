/**
 * Conductor - Context Engineering extension for Windsurf
 *
 * A spec-driven development framework that helps AI agents and developers
 * work together through structured tracks, plans, and quality gates.
 */
import type { CommandResult, SlashCommand } from './types';
import { setupCommand, implementCommand, statusCommand, newTrackCommand, reviewCommand, revertCommand, archiveCommand, registerSkillCommand } from './commands';
import { SkillCompositionEngine, CompositeSkillRecommender } from './utils/skillComposition';
import { SkillOrchestrationEngine } from './utils/skillOrchestration';
import { SpecValidator, PlanValidator } from './utils/validators';
import { AdvancedSkillScorer, AdvancedSkillRecommender } from './utils/advancedSkillScoring';
import { SkillFeedbackLoop } from './utils/feedbackLoop';
import { FrontendDevelopmentProtocol, BackendDevelopmentProtocol, MobileDevelopmentProtocol, ProtocolFactory, ProjectTypeDetector } from './utils/specializedProtocols';
import { ComplianceVerificationSystem } from './utils/complianceVerification';
import { ProjectType } from './utils/specializedProtocols';
export * from './types';
export * from './utils/fileSystem';
export * from './utils/markdown';
export { setupCommand, implementCommand, statusCommand, newTrackCommand, reviewCommand, revertCommand, archiveCommand, registerSkillCommand, };
export { SkillCompositionEngine, CompositeSkillRecommender, SkillOrchestrationEngine, SpecValidator, PlanValidator, AdvancedSkillScorer, AdvancedSkillRecommender, SkillFeedbackLoop, ComplianceVerificationSystem, FrontendDevelopmentProtocol, BackendDevelopmentProtocol, MobileDevelopmentProtocol, ProtocolFactory, ProjectTypeDetector, ProjectType };
/**
 * Execute a Conductor command
 */
export declare function executeCommand(commandName: string, projectRoot: string, args?: string[]): Promise<CommandResult>;
/**
 * Get all available commands
 */
export declare function getAvailableCommands(): SlashCommand[];
/**
 * Get command by name
 */
export declare function getCommand(name: string): SlashCommand | undefined;
/**
 * Check if a command exists
 */
export declare function hasCommand(name: string): boolean;
/**
 * Initialize Conductor utilities
 */
export declare function initializeUtilities(): {
    skillCompositionEngine: SkillCompositionEngine;
    skillOrchestrationEngine: SkillOrchestrationEngine;
    advancedScorer: AdvancedSkillScorer;
    feedbackLoop: SkillFeedbackLoop;
    complianceChecker: ComplianceVerificationSystem;
};
export declare const VERSION = "1.3.2";
declare const _default: {
    executeCommand: typeof executeCommand;
    getAvailableCommands: typeof getAvailableCommands;
    getCommand: typeof getCommand;
    hasCommand: typeof hasCommand;
    initializeUtilities: typeof initializeUtilities;
    VERSION: string;
};
export default _default;
