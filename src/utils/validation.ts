/**
 * Enhanced validation and setup checking system for Conductor
 * Following the protocols defined in the original Conductor TOML specifications
 */

import * as path from 'path';
import type { CommandContext, CommandResult, ValidationResult } from '../types';
import { fileExists, readFile, resolveConductorDir } from './fileSystem';

/**
 * Validate the Conductor setup by checking required core files
 */
export function validateSetup(context: CommandContext): ValidationResult {
  const conductorDir = resolveConductorDir(context.projectRoot);
  const requiredFiles = ['product.md', 'tech-stack.md', 'workflow.md'];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const file of requiredFiles) {
    const filePath = path.join(conductorDir, file);
    if (!fileExists(filePath)) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  // Check for tracks registry
  const tracksRegistryPath = path.join(conductorDir, 'index.md');
  if (!fileExists(tracksRegistryPath)) {
    errors.push('Missing tracks registry file: index.md');
  }

  // Check for skills directory
  const skillsDir = path.join(conductorDir, 'skills');
  if (!fileExists(skillsDir)) {
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
export function validateToolCall(success: boolean, errorMessage?: string): ValidationResult {
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
export function validateTrack(context: CommandContext, trackId: string): ValidationResult {
  const conductorDir = resolveConductorDir(context.projectRoot);
  const trackDir = path.join(conductorDir, 'tracks', trackId);
  const errors: string[] = [];

  // Check if track directory exists
  if (!fileExists(trackDir)) {
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
    if (!fileExists(filePath)) {
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
export function handleOperationFailure(operationName: string, error: unknown): CommandResult {
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
export function resolveProjectFile(context: CommandContext, fileName: string): string | null {
  const conductorDir = resolveConductorDir(context.projectRoot);
  const filePath = path.join(conductorDir, fileName);

  if (fileExists(filePath)) {
    return filePath;
  }

  return null;
}

/**
 * Enhanced track selection validation
 */
export function validateTrackSelection(context: CommandContext): ValidationResult {
  const conductorDir = resolveConductorDir(context.projectRoot);
  const tracksIndexPath = path.join(conductorDir, 'index.md');

  if (!fileExists(tracksIndexPath)) {
    return {
      success: false,
      message: 'Tracks registry not found',
      errors: ['Tracks registry file (index.md) not found']
    };
  }

  const content = readFile(tracksIndexPath);
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
export function validateSkillsSetup(context: CommandContext): ValidationResult {
  const conductorDir = resolveConductorDir(context.projectRoot);
  const skillsDir = path.join(conductorDir, 'skills');
  const catalogPath = path.join(skillsDir, 'catalog.md');

  const warnings: string[] = [];

  if (!fileExists(skillsDir)) {
    warnings.push('Skills directory not found, proceeding without skills');
    return {
      success: true, // Not a critical failure
      message: 'Skills directory not found, but not required',
      warnings
    };
  }

  if (!fileExists(catalogPath)) {
    warnings.push('Skills catalog not found, skills will not be recommended automatically');
  }

  return {
    success: true,
    message: 'Skills setup validated',
    warnings
  };
}