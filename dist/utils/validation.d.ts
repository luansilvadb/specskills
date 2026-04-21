/**
 * Enhanced validation and setup checking system for Conductor
 * Following the protocols defined in the original Conductor TOML specifications
 */
import type { CommandContext, CommandResult, ValidationResult } from '../types';
/**
 * Validate the Conductor setup by checking required core files
 */
export declare function validateSetup(context: CommandContext): ValidationResult;
/**
 * Validate that a specific tool call was successful
 */
export declare function validateToolCall(success: boolean, errorMessage?: string): ValidationResult;
/**
 * Validate the existence of a specific track and its files
 */
export declare function validateTrack(context: CommandContext, trackId: string): ValidationResult;
/**
 * Validate the success of an operation and handle failure appropriately
 */
export declare function handleOperationFailure(operationName: string, error: unknown): CommandResult;
/**
 * Universal File Resolution Protocol
 */
export declare function resolveProjectFile(context: CommandContext, fileName: string): string | null;
/**
 * Enhanced track selection validation
 */
export declare function validateTrackSelection(context: CommandContext): ValidationResult;
/**
 * Validation for skills directory and catalog
 */
export declare function validateSkillsSetup(context: CommandContext): ValidationResult;
