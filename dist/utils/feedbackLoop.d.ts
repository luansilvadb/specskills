/**
 * Skill Feedback Loop System for Conductor
 * Collects, analyzes, and applies feedback to improve skill recommendations
 */
import type { Skill, SkillWithScore } from '../types';
export interface SkillFeedback {
    id: string;
    skillId: string;
    trackId: string;
    projectId: string;
    timestamp: string;
    feedbackType: 'positive' | 'negative' | 'neutral' | 'improvement-suggestion';
    rating?: number;
    comment?: string;
    context?: string;
    outcome?: string;
    effectiveness?: number;
    usageDuration?: number;
}
export interface SkillLearningData {
    skillId: string;
    totalActivations: number;
    positiveFeedback: number;
    negativeFeedback: number;
    averageRating: number;
    totalRatingSum: number;
    lastUsed: string;
    successRate: number;
    improvementSuggestions: string[];
    effectivenessHistory: number[];
    usageDurationHistory: number[];
}
export interface FeedbackAggregation {
    skillId: string;
    feedbackCount: number;
    averageRating: number;
    successRate: number;
    commonIssues: string[];
    improvementSuggestions: string[];
    temporalPatterns: TemporalFeedbackPattern[];
}
export interface TemporalFeedbackPattern {
    timePeriod: 'day' | 'week' | 'month';
    periodStart: string;
    feedbackCount: number;
    averageRating: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}
export interface LearningConfiguration {
    feedbackWeight: number;
    recencyBias: number;
    minimumFeedbackThreshold: number;
    learningRate: number;
    effectivenessDecay: number;
}
export declare class SkillFeedbackLoop {
    private feedbackStore;
    private learningData;
    private config;
    private feedbackFilePath;
    constructor(feedbackFilePath: string, config?: Partial<LearningConfiguration>);
    /**
     * Submit feedback for a skill
     */
    submitFeedback(feedback: Omit<SkillFeedback, 'id'>): Promise<void>;
    /**
     * Generate a unique ID for feedback
     */
    private generateFeedbackId;
    /**
     * Update learning data based on new feedback
     */
    private updateLearningData;
    /**
     * Adjust skill scores based on learning data
     */
    adjustSkillScores(skills: Skill[], _contextProjectId: string): SkillWithScore[];
    /**
     * Get aggregated feedback for a skill
     */
    getAggregatedFeedback(skillId: string): FeedbackAggregation | null;
    /**
     * Calculate temporal feedback patterns
     */
    private calculateTemporalPatterns;
    /**
     * Decay older effectiveness scores
     */
    decayOldScores(): void;
    /**
     * Load feedback from storage
     */
    private loadFeedbackFromStorage;
    /**
     * Save feedback to storage
     */
    private saveFeedbackToStorage;
    /**
     * Load learning data from storage
     */
    private loadLearningDataFromStorage;
    /**
     * Save learning data to storage
     */
    private saveLearningDataToStorage;
    /**
     * Get learning data for a specific skill
     */
    getLearningData(skillId: string): SkillLearningData | undefined;
    /**
     * Get all learning data
     */
    getAllLearningData(): Map<string, SkillLearningData>;
    /**
     * Clear all feedback data (for testing or resets)
     */
    clearAllData(): void;
    /**
     * Get recommendation adjustments based on feedback for a specific project
     */
    getProjectAdjustedScores(skills: Skill[], projectId: string, originalScores: SkillWithScore[]): SkillWithScore[];
}
