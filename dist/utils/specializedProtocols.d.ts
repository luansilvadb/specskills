/**
 * Specialized Protocols for Different Project Types
 * Provides tailored workflows for front-end, back-end, and mobile development
 */
import type { CommandContext, CommandResult, Protocol, ProtocolStep } from '../types';
export declare enum ProjectType {
    FRONTEND = "frontend",
    BACKEND = "backend",
    MOBILE = "mobile",
    FULLSTACK = "fullstack",
    DESKTOP = "desktop"
}
export interface ProjectSpecificContext {
    projectType: ProjectType;
    framework?: string;
    targetPlatform?: string;
    uiFramework?: string;
    apiType?: string;
    deploymentTarget?: string;
}
export declare abstract class BaseSpecializedProtocol implements Protocol {
    abstract name: string;
    abstract description: string;
    abstract projectType: ProjectType;
    abstract steps: ProtocolStep[];
    execute(context: CommandContext): Promise<CommandResult>;
    /**
     * Validate if this protocol is applicable to the given context
     */
    validateApplicability(_context: CommandContext): {
        valid: boolean;
        reason?: string;
    };
}
export declare class FrontendDevelopmentProtocol extends BaseSpecializedProtocol {
    name: string;
    description: string;
    projectType: ProjectType;
    steps: {
        name: string;
        description: string;
        execute: (context: CommandContext) => Promise<CommandResult>;
        validate: (_context: CommandContext) => {
            success: boolean;
        };
    }[];
    checkFrontendConfig(context: CommandContext): Promise<boolean>;
    detectFrontendFramework(context: CommandContext): Promise<string | null>;
    checkFileExists(context: CommandContext, fileName: string): Promise<boolean>;
}
export declare class BackendDevelopmentProtocol extends BaseSpecializedProtocol {
    name: string;
    description: string;
    projectType: ProjectType;
    steps: {
        name: string;
        description: string;
        execute: (context: CommandContext) => Promise<CommandResult>;
        validate: (_context: CommandContext) => {
            success: boolean;
        };
    }[];
    checkServerFiles(context: CommandContext): Promise<boolean>;
    checkBackendConfig(context: CommandContext): Promise<boolean>;
    detectBackendFramework(context: CommandContext): Promise<string | null>;
    detectDatabaseTech(context: CommandContext): Promise<string | null>;
    checkFileExists(context: CommandContext, fileName: string): Promise<boolean>;
}
export declare class MobileDevelopmentProtocol extends BaseSpecializedProtocol {
    name: string;
    description: string;
    projectType: ProjectType;
    steps: {
        name: string;
        description: string;
        execute: (context: CommandContext) => Promise<CommandResult>;
        validate: (_context: CommandContext) => {
            success: boolean;
        };
    }[];
    checkMobileConfig(context: CommandContext): Promise<boolean>;
    detectMobilePlatform(context: CommandContext): Promise<string>;
    checkFileExists(context: CommandContext, fileName: string): Promise<boolean>;
}
export declare class ProtocolFactory {
    /**
     * Create the appropriate protocol based on project context
     */
    static createProtocolForProject(projectType: ProjectType): BaseSpecializedProtocol;
    /**
     * Auto-detect project type from context and create appropriate protocol
     */
    static createProtocolFromContext(context: CommandContext): Promise<BaseSpecializedProtocol | null>;
}
export declare class ProjectTypeDetector {
    /**
     * Auto-detect project type based on files and configuration
     */
    detectProjectType(context: CommandContext): Promise<ProjectType | null>;
}
