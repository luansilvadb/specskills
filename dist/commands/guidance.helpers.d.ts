/**
 * Helper functions for implementation guidance generation
 */
export declare function generateInitialGuidanceMessage(selectedTrack: any): string;
export declare function generateTaskStatusSection(currentTask: any, pendingTasks: any[]): string;
export declare function generateSpecInfo(trackDir: string): string;
export declare function generateProjectContextInfo(conductorDir: string): string;
export declare function generateProtocolsInfo(activeSkills: any[]): string;
export declare function generateWorkflowInstructions(): string;
export declare function generateContextInfo(conductorDir: string, trackDir: string, activeSkills: any[]): string;
export declare function generateImplementationGuidance(selectedTrack: any, tasks: any[], activeSkills: any[], conductorDir: string, trackDir: string): string;
