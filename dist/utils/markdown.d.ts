/**
 * Markdown parsing utilities
 */
export interface ParsedTask {
    status: 'pending' | 'in_progress' | 'completed';
    description: string;
    commitHash?: string;
}
export interface ParsedTrack {
    status: 'pending' | 'in_progress' | 'completed';
    description: string;
    folderPath: string;
    metadata?: Record<string, string>;
}
export interface ParsedSpecDocument {
    id: string;
    title: string;
    description: string;
    version?: string;
    status: 'draft' | 'review' | 'approved' | 'deprecated';
    createdAt: string;
    updatedAt: string;
    requirements: Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        priority: string;
    }>;
    acceptanceCriteria: Array<{
        id: string;
        description: string;
    }>;
    technicalNotes?: string;
}
/**
 * Parse a spec document from markdown content
 */
export declare function parseSpecDocument(content: string): ParsedSpecDocument;
/**
 * Parse a tracks index file to extract track information.
 * Supports both legacy list format and high-fidelity separator format.
 */
export declare function parseTracksIndex(content: string): ParsedTrack[];
/**
 * Parse a plan file to extract tasks
 */
export declare function parsePlanTasks(content: string): ParsedTask[];
/**
 * Update task status in markdown content
 */
export declare function updateTaskStatus(content: string, taskDescription: string, newStatus: 'pending' | 'in_progress' | 'completed', commitHash?: string): string;
/**
 * Update track status in markdown content
 */
export declare function updateTrackStatus(content: string, trackDescription: string, newStatus: 'pending' | 'in_progress' | 'completed'): string;
/**
 * Count tasks by status
 */
export declare function countTasksByStatus(tasks: ParsedTask[]): {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
}; /**
 * Reconcile catalog content with a list of skills
 */
export declare function reconcileCatalog(content: string, skills: any[]): string;
/**
 * Render a text-based progress bar
 */
export declare function renderProgressBar(percent: number, width?: number): string;
