import type { CommandResult } from '../types';
export declare function validateProjectSetup(conductorDir: string): CommandResult | null;
export declare function readAndParseTracks(conductorDir: string, noTracksMessage?: string): {
    tracks: any[];
    result: CommandResult | null;
};
export declare function selectTrack(tracks: any[], contextArgs: string[]): {
    selectedTrack: any | null;
    result: CommandResult | null;
};
export declare function validateTrackStructure(trackDir: string, selectedTrack: {
    folderPath: string;
    description: string;
}): CommandResult | null;
export declare function readAndParseTrackPlan(trackDir: string, selectedTrack: any, conductorDir: string): {
    planContent: string | null;
    activeSkills: any[];
    tasks: any[];
    result: CommandResult | null;
};
export declare function updateTrackStatusInIndex(conductorDir: string, trackDescription: string, newStatus: 'pending' | 'in_progress' | 'completed'): Promise<void>;
export declare function handleTrackCompletion(selectedTrack: any, tasks: any[]): {
    completed: boolean;
    result: CommandResult | null;
};
