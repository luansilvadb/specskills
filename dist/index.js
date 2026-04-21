"use strict";
/**
 * Conductor - Context Engineering extension for Windsurf
 *
 * A spec-driven development framework that helps AI agents and developers
 * work together through structured tracks, plans, and quality gates.
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.ProjectType = exports.ProjectTypeDetector = exports.ProtocolFactory = exports.MobileDevelopmentProtocol = exports.BackendDevelopmentProtocol = exports.FrontendDevelopmentProtocol = exports.ComplianceVerificationSystem = exports.SkillFeedbackLoop = exports.AdvancedSkillRecommender = exports.AdvancedSkillScorer = exports.PlanValidator = exports.SpecValidator = exports.SkillOrchestrationEngine = exports.CompositeSkillRecommender = exports.SkillCompositionEngine = exports.registerSkillCommand = exports.archiveCommand = exports.revertCommand = exports.reviewCommand = exports.newTrackCommand = exports.statusCommand = exports.implementCommand = exports.setupCommand = void 0;
exports.executeCommand = executeCommand;
exports.getAvailableCommands = getAvailableCommands;
exports.getCommand = getCommand;
exports.hasCommand = hasCommand;
exports.initializeUtilities = initializeUtilities;
const commands_1 = require("./commands");
Object.defineProperty(exports, "setupCommand", { enumerable: true, get: function () { return commands_1.setupCommand; } });
Object.defineProperty(exports, "implementCommand", { enumerable: true, get: function () { return commands_1.implementCommand; } });
Object.defineProperty(exports, "statusCommand", { enumerable: true, get: function () { return commands_1.statusCommand; } });
Object.defineProperty(exports, "newTrackCommand", { enumerable: true, get: function () { return commands_1.newTrackCommand; } });
Object.defineProperty(exports, "reviewCommand", { enumerable: true, get: function () { return commands_1.reviewCommand; } });
Object.defineProperty(exports, "revertCommand", { enumerable: true, get: function () { return commands_1.revertCommand; } });
Object.defineProperty(exports, "archiveCommand", { enumerable: true, get: function () { return commands_1.archiveCommand; } });
Object.defineProperty(exports, "registerSkillCommand", { enumerable: true, get: function () { return commands_1.registerSkillCommand; } });
const fileSystem_1 = require("./utils/fileSystem");
const skillComposition_1 = require("./utils/skillComposition");
Object.defineProperty(exports, "SkillCompositionEngine", { enumerable: true, get: function () { return skillComposition_1.SkillCompositionEngine; } });
Object.defineProperty(exports, "CompositeSkillRecommender", { enumerable: true, get: function () { return skillComposition_1.CompositeSkillRecommender; } });
const skillOrchestration_1 = require("./utils/skillOrchestration");
Object.defineProperty(exports, "SkillOrchestrationEngine", { enumerable: true, get: function () { return skillOrchestration_1.SkillOrchestrationEngine; } });
const validators_1 = require("./utils/validators");
Object.defineProperty(exports, "SpecValidator", { enumerable: true, get: function () { return validators_1.SpecValidator; } });
Object.defineProperty(exports, "PlanValidator", { enumerable: true, get: function () { return validators_1.PlanValidator; } });
const advancedSkillScoring_1 = require("./utils/advancedSkillScoring");
Object.defineProperty(exports, "AdvancedSkillScorer", { enumerable: true, get: function () { return advancedSkillScoring_1.AdvancedSkillScorer; } });
Object.defineProperty(exports, "AdvancedSkillRecommender", { enumerable: true, get: function () { return advancedSkillScoring_1.AdvancedSkillRecommender; } });
const feedbackLoop_1 = require("./utils/feedbackLoop");
Object.defineProperty(exports, "SkillFeedbackLoop", { enumerable: true, get: function () { return feedbackLoop_1.SkillFeedbackLoop; } });
const specializedProtocols_1 = require("./utils/specializedProtocols");
Object.defineProperty(exports, "FrontendDevelopmentProtocol", { enumerable: true, get: function () { return specializedProtocols_1.FrontendDevelopmentProtocol; } });
Object.defineProperty(exports, "BackendDevelopmentProtocol", { enumerable: true, get: function () { return specializedProtocols_1.BackendDevelopmentProtocol; } });
Object.defineProperty(exports, "MobileDevelopmentProtocol", { enumerable: true, get: function () { return specializedProtocols_1.MobileDevelopmentProtocol; } });
Object.defineProperty(exports, "ProtocolFactory", { enumerable: true, get: function () { return specializedProtocols_1.ProtocolFactory; } });
Object.defineProperty(exports, "ProjectTypeDetector", { enumerable: true, get: function () { return specializedProtocols_1.ProjectTypeDetector; } });
const complianceVerification_1 = require("./utils/complianceVerification");
Object.defineProperty(exports, "ComplianceVerificationSystem", { enumerable: true, get: function () { return complianceVerification_1.ComplianceVerificationSystem; } });
const specializedProtocols_2 = require("./utils/specializedProtocols");
Object.defineProperty(exports, "ProjectType", { enumerable: true, get: function () { return specializedProtocols_2.ProjectType; } });
// Export types
__exportStar(require("./types"), exports);
__exportStar(require("./utils/fileSystem"), exports);
__exportStar(require("./utils/markdown"), exports);
// Command registry
const commands = new Map([
    [commands_1.setupCommand.name, commands_1.setupCommand],
    [commands_1.implementCommand.name, commands_1.implementCommand],
    [commands_1.statusCommand.name, commands_1.statusCommand],
    [commands_1.newTrackCommand.name, commands_1.newTrackCommand],
    [commands_1.reviewCommand.name, commands_1.reviewCommand],
    [commands_1.revertCommand.name, commands_1.revertCommand],
    [commands_1.archiveCommand.name, commands_1.archiveCommand],
    [commands_1.registerSkillCommand.name, commands_1.registerSkillCommand],
]);
/**
 * Execute a Conductor command
 */
async function executeCommand(commandName, projectRoot, args = []) {
    const command = commands.get(commandName);
    if (!command) {
        return {
            success: false,
            message: `Unknown command: ${commandName}. Available commands: ${Array.from(commands.keys()).join(', ')}`,
        };
    }
    const context = {
        projectRoot,
        conductorDir: (0, fileSystem_1.resolveConductorDir)(projectRoot),
        args,
    };
    return await command.execute(context, args);
}
/**
 * Get all available commands
 */
function getAvailableCommands() {
    return Array.from(commands.values());
}
/**
 * Get command by name
 */
function getCommand(name) {
    return commands.get(name);
}
/**
 * Check if a command exists
 */
function hasCommand(name) {
    return commands.has(name);
}
/**
 * Initialize Conductor utilities
 */
function initializeUtilities() {
    const compositionEngine = new skillComposition_1.SkillCompositionEngine();
    const orchestrationEngine = new skillOrchestration_1.SkillOrchestrationEngine(compositionEngine);
    const advancedScorer = new advancedSkillScoring_1.AdvancedSkillScorer();
    const feedbackLoop = new feedbackLoop_1.SkillFeedbackLoop('./feedback.json');
    const complianceChecker = new complianceVerification_1.ComplianceVerificationSystem();
    return {
        skillCompositionEngine: compositionEngine,
        skillOrchestrationEngine: orchestrationEngine,
        advancedScorer: advancedScorer,
        feedbackLoop: feedbackLoop,
        complianceChecker: complianceChecker
    };
}
// Version
exports.VERSION = '1.3.2';
// Default export
exports.default = {
    executeCommand,
    getAvailableCommands,
    getCommand,
    hasCommand,
    initializeUtilities,
    VERSION: exports.VERSION,
};
