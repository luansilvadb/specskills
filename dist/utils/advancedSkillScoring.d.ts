/**
 * Advanced Skill Scoring System for Conductor
 * Implements sophisticated algorithms for skill recommendation
 */
import type { Skill, SkillWithScore } from '../types';
export interface SkillScoringContext {
    trackPrompt: string;
    productContext: string;
    techStackContext: string;
    projectHistory?: string[];
    usageMetrics?: UsageMetrics;
    userPreferences?: UserPreferenceProfile;
}
export interface UsageMetrics {
    activationCount: number;
    successRate: number;
    avgTimeToCompletion: number;
    userRating?: number;
    feedbackCount: number;
}
export interface UserPreferenceProfile {
    preferredDomains: string[];
    preferredComplexity: 'simple' | 'moderate' | 'complex';
    pastPositiveInteractions: string[];
    pastNegativeInteractions: string[];
    responseTimePreferences: 'fast' | 'accurate' | 'balanced';
}
export interface ScoringFactors {
    keywordMatch: number;
    semanticSimilarity: number;
    contextualRelevance: number;
    historicalPerformance: number;
    userPreferenceAlignment: number;
    dependencyFit: number;
    resourceEfficiency: number;
}
export interface ScoringWeights {
    keywordMatch: number;
    semanticSimilarity: number;
    contextualRelevance: number;
    historicalPerformance: number;
    userPreferenceAlignment: number;
    dependencyFit: number;
    resourceEfficiency: number;
}
export declare class AdvancedSkillScorer {
    private defaultWeights;
    /**
     * Calculate scores for all skills based on the context
     */
    calculateScores(skills: Skill[], context: SkillScoringContext, weights?: Partial<ScoringWeights>): SkillWithScore[];
    /**
     * Calculate individual scoring factors for a skill
     */
    private calculateFactors;
    /**
     * Calculate keyword match score
     */
    private calculateKeywordMatch;
    /**
     * Calculate semantic similarity score (simplified implementation)
     */
    private calculateSemanticSimilarity;
    /**
     * Calculate contextual relevance score
     */
    private calculateContextualRelevance;
    /**
     * Calculate historical performance score
     */
    private calculateHistoricalPerformance;
    /**
     * Calculate user preference alignment score
     */
    private calculateUserPreferenceAlignment;
    /**
     * Calculate dependency fit score
     */
    private calculateDependencyFit;
    /**
     * Calculate resource efficiency score
     */
    private calculateResourceEfficiency;
    /**
     * Aggregate scores based on weights
     */
    private aggregateScore;
    /**
     * Tokenize text into words
     */
    private tokenize;
    /**
     * Calculate overlap between two token arrays
     */
    private calculateTokenOverlap;
    /**
     * Identify related terms between contexts
     */
    private getIdentifyRelatedTerms;
    /**
     * Check if tokens are semantically related (simplified)
     */
    private areSemanticallyRelated;
    /**
     * Check if tokens are simple variants (plural, tense, etc.)
     */
    private areSimpleVariants;
    /**
     * Check if tokens might be synonyms (simplified)
     */
    private areSynonymLike;
    /**
     * Estimate skill complexity based on various factors
     */
    private estimateSkillComplexity;
    /**
     * Estimate skill effort/time required
     */
    private estimateSkillEffort;
}
/**
 * Utility class to recommend skills using the advanced scorer
 */
export declare class AdvancedSkillRecommender {
    private scorer;
    constructor();
    /**
     * Recommend skills based on context using advanced scoring
     */
    recommendSkills(skills: Skill[], context: SkillScoringContext, minScore?: number, maxResults?: number): SkillWithScore[];
    /**
     * Create a scoring context from a simple description
     */
    createContext(trackDescription: string, productContext?: string, techStackContext?: string): SkillScoringContext;
}
