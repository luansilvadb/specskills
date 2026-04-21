/**
 * Protocol framework for Conductor
 * Implements robust protocols as defined in the Conductor TOML specifications
 */
import type { CommandContext, CommandResult, Protocol, ProtocolStep, ValidationResult } from '../types';
export declare abstract class BaseProtocol implements Protocol {
    abstract name: string;
    abstract description: string;
    abstract steps: ProtocolStep[];
    execute(context: CommandContext): Promise<CommandResult>;
}
export declare class SetupCheckProtocol extends BaseProtocol {
    name: string;
    description: string;
    steps: {
        name: string;
        description: string;
        execute: (_context: CommandContext) => Promise<CommandResult>;
        validate: (_context: CommandContext) => ValidationResult;
    }[];
}
export declare class TrackSelectionProtocol extends BaseProtocol {
    name: string;
    description: string;
    steps: {
        name: string;
        description: string;
        execute: (_context: CommandContext) => Promise<CommandResult>;
        validate: (_context: CommandContext) => ValidationResult;
    }[];
}
export declare class TrackImplementationProtocol extends BaseProtocol {
    name: string;
    description: string;
    steps: {
        name: string;
        description: string;
        execute: (_context: CommandContext) => Promise<CommandResult>;
        validate: (_context: CommandContext) => ValidationResult;
    }[];
}
export declare class DocumentationSyncProtocol extends BaseProtocol {
    name: string;
    description: string;
    steps: {
        name: string;
        description: string;
        execute: (_context: CommandContext) => Promise<CommandResult>;
        validate: (_context: CommandContext) => ValidationResult;
    }[];
}
export declare class TrackCleanupProtocol extends BaseProtocol {
    name: string;
    description: string;
    steps: {
        name: string;
        description: string;
        execute: (_context: CommandContext) => Promise<CommandResult>;
        validate: (_context: CommandContext) => ValidationResult;
    }[];
}
export declare function getProtocol(protocolName: string): Protocol | undefined;
