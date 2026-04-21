"use strict";
/**
 * Enhanced validation and setup checking system for Conductor
 * Following the protocols defined in the original Conductor TOML specifications
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
exports.validateSetup = validateSetup;
exports.validateToolCall = validateToolCall;
exports.validateTrack = validateTrack;
exports.handleOperationFailure = handleOperationFailure;
exports.resolveProjectFile = resolveProjectFile;
exports.validateTrackSelection = validateTrackSelection;
exports.validateSkillsSetup = validateSkillsSetup;
const path = __importStar(require("path"));
const fileSystem_1 = require("./fileSystem");
/**
 * Validate the Conductor setup by checking required core files
 */
function validateSetup(context) {
    const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
    const requiredFiles = ['product.md', 'tech-stack.md', 'workflow.md'];
    const errors = [];
    const warnings = [];
    for (const file of requiredFiles) {
        const filePath = path.join(conductorDir, file);
        if (!(0, fileSystem_1.fileExists)(filePath)) {
            errors.push(`Missing required file: ${file}`);
        }
    }
    // Check for tracks registry
    const tracksRegistryPath = path.join(conductorDir, 'index.md');
    if (!(0, fileSystem_1.fileExists)(tracksRegistryPath)) {
        errors.push('Missing tracks registry file: index.md');
    }
    // Check for skills directory
    const skillsDir = path.join(conductorDir, 'skills');
    if (!(0, fileSystem_1.fileExists)(skillsDir)) {
        warnings.push('Skills directory not found: conductor/skills');
    }
    return {
        success: errors.length === 0,
        message: errors.length > 0 ? `Setup validation failed with ${errors.length} error(s)` : 'Setup validation passed',
        errors,
        warnings
    };
}
/**
 * Validate that a specific tool call was successful
 */
function validateToolCall(success, errorMessage) {
    if (!success) {
        return {
            success: false,
            message: errorMessage || 'Tool call failed',
            errors: [errorMessage || 'Tool call failed']
        };
    }
    return {
        success: true,
        message: 'Tool call succeeded'
    };
}
/**
 * Validate the existence of a specific track and its files
 */
function validateTrack(context, trackId) {
    const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
    const trackDir = path.join(conductorDir, 'tracks', trackId);
    const errors = [];
    // Check if track directory exists
    if (!(0, fileSystem_1.fileExists)(trackDir)) {
        errors.push(`Track directory does not exist: ${trackDir}`);
        return {
            success: false,
            message: `Track '${trackId}' not found`,
            errors
        };
    }
    // Check for required track files
    const requiredTrackFiles = ['spec.md', 'plan.md'];
    for (const file of requiredTrackFiles) {
        const filePath = path.join(trackDir, file);
        if (!(0, fileSystem_1.fileExists)(filePath)) {
            errors.push(`Missing required track file: ${path.join(trackId, file)}`);
        }
    }
    return {
        success: errors.length === 0,
        message: errors.length > 0 ? `Track validation failed with ${errors.length} error(s)` : 'Track validation passed',
        errors
    };
}
/**
 * Validate the success of an operation and handle failure appropriately
 */
function handleOperationFailure(operationName, error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Operation failed: ${operationName}. Error: ${errorMessage}`);
    return {
        success: false,
        message: `Operation '${operationName}' failed: ${errorMessage}`
    };
}
/**
 * Universal File Resolution Protocol
 */
function resolveProjectFile(context, fileName) {
    const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
    const filePath = path.join(conductorDir, fileName);
    if ((0, fileSystem_1.fileExists)(filePath)) {
        return filePath;
    }
    return null;
}
/**
 * Enhanced track selection validation
 */
function validateTrackSelection(context) {
    const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
    const tracksIndexPath = path.join(conductorDir, 'index.md');
    if (!(0, fileSystem_1.fileExists)(tracksIndexPath)) {
        return {
            success: false,
            message: 'Tracks registry not found',
            errors: ['Tracks registry file (index.md) not found']
        };
    }
    const content = (0, fileSystem_1.readFile)(tracksIndexPath);
    if (!content) {
        return {
            success: false,
            message: 'Cannot read tracks registry',
            errors: ['Unable to read tracks registry file']
        };
    }
    // Basic validation - check if there are any tracks defined
    const hasTracks = content.includes('[ ]') || content.includes('[~]') || content.includes('[x]');
    if (!hasTracks) {
        return {
            success: false,
            message: 'No tracks found in registry',
            warnings: ['The tracks file appears to be empty or malformed']
        };
    }
    return {
        success: true,
        message: 'Track selection validation passed'
    };
}
/**
 * Validation for skills directory and catalog
 */
function validateSkillsSetup(context) {
    const conductorDir = (0, fileSystem_1.resolveConductorDir)(context.projectRoot);
    const skillsDir = path.join(conductorDir, 'skills');
    const catalogPath = path.join(skillsDir, 'catalog.md');
    const warnings = [];
    if (!(0, fileSystem_1.fileExists)(skillsDir)) {
        warnings.push('Skills directory not found, proceeding without skills');
        return {
            success: true, // Not a critical failure
            message: 'Skills directory not found, but not required',
            warnings
        };
    }
    if (!(0, fileSystem_1.fileExists)(catalogPath)) {
        warnings.push('Skills catalog not found, skills will not be recommended automatically');
    }
    return {
        success: true,
        message: 'Skills setup validated',
        warnings
    };
}
