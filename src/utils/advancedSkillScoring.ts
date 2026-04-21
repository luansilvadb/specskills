/**
 * Advanced Skill Scoring System for Conductor
 * Implements sophisticated algorithms for skill recommendation
 */

import type { Skill, SkillWithScore } from '../types';

export interface SkillScoringContext {
  trackPrompt: string;
  productContext: string;
  techStackContext: string;
  projectHistory?: string[]; // Previous decisions, outcomes
  usageMetrics?: UsageMetrics;
  userPreferences?: UserPreferenceProfile;
}

export interface UsageMetrics {
  activationCount: number; // How many times this skill was activated
  successRate: number; // Percentage of successful outcomes
  avgTimeToCompletion: number; // Average time for tasks using this skill
  userRating?: number; // Average rating given by users
  feedbackCount: number; // Number of feedback items received
}

export interface UserPreferenceProfile {
  preferredDomains: string[]; // Which skill domains user prefers
  preferredComplexity: 'simple' | 'moderate' | 'complex';
  pastPositiveInteractions: string[]; // Skills that worked well for this user
  pastNegativeInteractions: string[]; // Skills that didn't work well for this user
  responseTimePreferences: 'fast' | 'accurate' | 'balanced';
}

export interface ScoringFactors {
  keywordMatch: number; // Direct matching with context
  semanticSimilarity: number; // Semantic matching beyond keywords
  contextualRelevance: number; // Relevance to project context
  historicalPerformance: number; // Past success with similar tasks
  userPreferenceAlignment: number; // Alignment with user preferences
  dependencyFit: number; // How well it fits with other selected skills
  resourceEfficiency: number; // How efficiently it uses resources
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

export class AdvancedSkillScorer {
  private defaultWeights: ScoringWeights = {
    keywordMatch: 0.25,
    semanticSimilarity: 0.20,
    contextualRelevance: 0.15,
    historicalPerformance: 0.15,
    userPreferenceAlignment: 0.10,
    dependencyFit: 0.10,
    resourceEfficiency: 0.05
  };

  /**
   * Calculate scores for all skills based on the context
   */
  calculateScores(
    skills: Skill[],
    context: SkillScoringContext,
    weights: Partial<ScoringWeights> = {}
  ): SkillWithScore[] {
    // Merge custom weights with defaults
    const finalWeights: ScoringWeights = {
      ...this.defaultWeights,
      ...weights
    };

    // Normalize weights to sum to 1
    const totalWeight = Object.values(finalWeights).reduce((sum, w) => sum + w, 0);
    const normalizedWeights: ScoringWeights = {
      keywordMatch: finalWeights.keywordMatch / totalWeight,
      semanticSimilarity: finalWeights.semanticSimilarity / totalWeight,
      contextualRelevance: finalWeights.contextualRelevance / totalWeight,
      historicalPerformance: finalWeights.historicalPerformance / totalWeight,
      userPreferenceAlignment: finalWeights.userPreferenceAlignment / totalWeight,
      dependencyFit: finalWeights.dependencyFit / totalWeight,
      resourceEfficiency: finalWeights.resourceEfficiency / totalWeight
    };

    return skills.map(skill => {
      const factors = this.calculateFactors(skill, context);
      const score = this.aggregateScore(factors, normalizedWeights);

      return { skill, score };
    });
  }

  /**
   * Calculate individual scoring factors for a skill
   */
  private calculateFactors(skill: Skill, context: SkillScoringContext): ScoringFactors {
    return {
      keywordMatch: this.calculateKeywordMatch(skill, context),
      semanticSimilarity: this.calculateSemanticSimilarity(skill, context),
      contextualRelevance: this.calculateContextualRelevance(skill, context),
      historicalPerformance: this.calculateHistoricalPerformance(skill, context),
      userPreferenceAlignment: this.calculateUserPreferenceAlignment(skill, context),
      dependencyFit: this.calculateDependencyFit(skill, context),
      resourceEfficiency: this.calculateResourceEfficiency(skill, context)
    };
  }

  /**
   * Calculate keyword match score
   */
  private calculateKeywordMatch(skill: Skill, context: SkillScoringContext): number {
    // Combine all context elements
    const fullContext = [
      context.trackPrompt,
      context.productContext,
      context.techStackContext,
      ...(context.projectHistory || [])
    ].filter(Boolean).join(' ');

    // Tokenize context
    const contextTokens = this.tokenize(fullContext.toLowerCase());

    // Score based on various skill properties
    let score = 0;

    // Title match
    const titleTokens = this.tokenize(skill.title.toLowerCase());
    score += this.calculateTokenOverlap(titleTokens, contextTokens) * 20; // Higher weight for title

    // Keyword match
    const keywordTokens = skill.keywords.map(k => k.toLowerCase());
    score += this.calculateTokenOverlap(keywordTokens, contextTokens) * 15;

    // Purpose match
    if (skill.purpose) {
      const purposeTokens = this.tokenize(skill.purpose.toLowerCase());
      score += this.calculateTokenOverlap(purposeTokens, contextTokens) * 12;
    }

    // Content match
    const contentTokens = this.tokenize(skill.content.toLowerCase());
    score += this.calculateTokenOverlap(contentTokens, contextTokens) * 8;

    // Tech affinity match
    const techAffinityTokens = skill.techAffinity.map(a => a.toLowerCase());
    score += this.calculateTokenOverlap(techAffinityTokens, contextTokens) * 10;

    return Math.min(score / 100, 1); // Normalize to 0-1 range
  }

  /**
   * Calculate semantic similarity score (simplified implementation)
   */
  private calculateSemanticSimilarity(skill: Skill, context: SkillScoringContext): number {
    // In a real implementation, this would use embeddings or semantic models
    // For now, we'll use an extended keyword approach

    const fullContext = [
      context.trackPrompt,
      context.productContext,
      context.techStackContext
    ].filter(Boolean).join(' ').toLowerCase();

    const skillText = [
      skill.title,
      skill.purpose || '',
      skill.content,
      ...skill.keywords,
      ...skill.techAffinity
    ].filter(Boolean).join(' ').toLowerCase();

    // Calculate a basic semantic similarity based on related terms
    const relatedTerms = this.getIdentifyRelatedTerms(fullContext, skillText);
    return Math.min(relatedTerms.length / 5, 1); // Normalize to 0-1 range
  }

  /**
   * Calculate contextual relevance score
   */
  private calculateContextualRelevance(skill: Skill, context: SkillScoringContext): number {
    let score = 0;

    // Domain relevance to product context
    if (context.productContext && context.productContext.toLowerCase().includes(skill.domain.toLowerCase())) {
      score += 0.3;
    }

    // Tech stack relevance
    if (context.techStackContext) {
      const techContext = context.techStackContext.toLowerCase();
      const techMatches = skill.techAffinity.filter(affinity =>
        techContext.includes(affinity.toLowerCase())
      ).length;
      score += (techMatches / skill.techAffinity.length) * 0.4;
    }

    // Prompt relevance
    if (context.trackPrompt) {
      const promptContext = context.trackPrompt.toLowerCase();
      const keywordMatches = skill.keywords.filter(keyword =>
        promptContext.includes(keyword.toLowerCase())
      ).length;
      score += (keywordMatches / Math.max(skill.keywords.length, 1)) * 0.3;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate historical performance score
   */
  private calculateHistoricalPerformance(_skill: Skill, context: SkillScoringContext): number {
    if (!context.usageMetrics) {
      return 0.5; // Neutral score if no history
    }

    const metrics = context.usageMetrics;

    let score = 0;

    // Activation count influence (more usage can mean more refined)
    if (metrics.activationCount > 10) {
      score += 0.1; // Small boost for frequently used skills
    }

    // Success rate (most important factor)
    score += (metrics.successRate / 100) * 0.6;

    // User rating influence
    if (metrics.userRating) {
      score += (metrics.userRating / 5) * 0.2; // Assuming 1-5 scale
    }

    // Feedback count (indicates reliability of metrics)
    if (metrics.feedbackCount > 5) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Calculate user preference alignment score
   */
  private calculateUserPreferenceAlignment(skill: Skill, context: SkillScoringContext): number {
    if (!context.userPreferences) {
      return 0.5; // Neutral score if no preferences
    }

    const prefs = context.userPreferences;
    let score = 0;

    // Domain preference match
    if (prefs.preferredDomains.includes(skill.domain)) {
      score += 0.3;
    }

    // Complexity preference match (based on skill complexity indicators)
    const skillComplexity = this.estimateSkillComplexity(skill);
    if ((prefs.preferredComplexity === 'simple' && skillComplexity <= 0.3) ||
        (prefs.preferredComplexity === 'moderate' && skillComplexity > 0.3 && skillComplexity <= 0.7) ||
        (prefs.preferredComplexity === 'complex' && skillComplexity > 0.7)) {
      score += 0.2;
    }

    // Positive history match
    if (prefs.pastPositiveInteractions.includes(skill.id)) {
      score += 0.3;
    }

    // Negative history penalty
    if (prefs.pastNegativeInteractions.includes(skill.id)) {
      score -= 0.5; // Strong penalty
    }

    // Response time preference match
    const skillEffort = this.estimateSkillEffort(skill);
    if ((prefs.responseTimePreferences === 'fast' && skillEffort <= 0.4) ||
        (prefs.responseTimePreferences === 'accurate' && skillEffort >= 0.7) ||
        (prefs.responseTimePreferences === 'balanced' && skillEffort > 0.4 && skillEffort < 0.7)) {
      score += 0.2;
    }

    return Math.max(Math.min(score, 1), 0); // Clamp to 0-1 range
  }

  /**
   * Calculate dependency fit score
   */
  private calculateDependencyFit(skill: Skill, _context: SkillScoringContext): number {
    // In a real implementation, this would analyze dependencies with other selected skills
    // For now, we'll use a simple approach based on compatibility indicators

    // Check if skill has dependencies
    if (skill.dependencies && skill.dependencies.length > 0) {
      // Would need to check if dependencies are satisfied
      // Returning neutral for now
      return 0.5;
    }

    // Check if skill conflicts with common practices
    if (skill.directives.toLowerCase().includes('avoid') ||
        skill.directives.toLowerCase().includes('conflict')) {
      return 0.3;
    }

    // Default compatibility score
    return 0.7;
  }

  /**
   * Calculate resource efficiency score
   */
  private calculateResourceEfficiency(skill: Skill, _context: SkillScoringContext): number {
    // Estimate how efficiently the skill uses computational resources
    const complexity = this.estimateSkillComplexity(skill);
    const effort = this.estimateSkillEffort(skill);

    // Lower complexity and effort = higher efficiency
    return Math.max(0, 1 - complexity) * Math.max(0, 1 - effort);
  }

  /**
   * Aggregate scores based on weights
   */
  private aggregateScore(factors: ScoringFactors, weights: ScoringWeights): number {
    return Object.entries(factors).reduce((total, [factor, value]) => {
      const weight = weights[factor as keyof ScoringWeights] || 0;
      return total + (value * weight);
    }, 0);
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\sÀ-ÿ]/g, ' ') // Support Portuguese and other Latin characters
      .toLowerCase()
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * Calculate overlap between two token arrays
   */
  private calculateTokenOverlap(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = [...set1].filter(x => set2.has(x));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.length / union.size : 0;
  }

  /**
   * Identify related terms between contexts
   */
  private getIdentifyRelatedTerms(context1: string, context2: string): string[] {
    const tokens1 = new Set(this.tokenize(context1));
    const tokens2 = new Set(this.tokenize(context2));

    return [...tokens1].filter(token =>
      tokens2.has(token) ||
      this.areSemanticallyRelated(token, Array.from(tokens2))
    );
  }

  /**
   * Check if tokens are semantically related (simplified)
   */
  private areSemanticallyRelated(token: string, candidates: string[]): boolean {
    // In a real implementation, this would use word embeddings or semantic databases
    // For now, simple variations and synonyms check
    return candidates.some(candidate =>
      this.areSimpleVariants(token, candidate) ||
      this.areSynonymLike(token, candidate)
    );
  }

  /**
   * Check if tokens are simple variants (plural, tense, etc.)
   */
  private areSimpleVariants(token1: string, token2: string): boolean {
    // Basic stemming/simplification
    const stem1 = token1.replace(/(s|ed|ing|er|est)$/, '');
    const stem2 = token2.replace(/(s|ed|ing|er|est)$/, '');

    return stem1 === stem2 ||
           token1 === token2 + 's' ||
           token2 === token1 + 's' ||
           token1 === token2 + 'ing' ||
           token2 === token1 + 'ing';
  }

  /**
   * Check if tokens might be synonyms (simplified)
   */
  private areSynonymLike(token1: string, token2: string): boolean {
    const synonymGroups = [
      ['create', 'make', 'build', 'develop'],
      ['test', 'verify', 'validate', 'check'],
      ['secure', 'protect', 'safeguard', 'shield'],
      ['optimize', 'improve', 'enhance', 'refine'],
      ['debug', 'fix', 'correct', 'troubleshoot']
    ];

    return synonymGroups.some(group =>
      group.includes(token1) && group.includes(token2)
    );
  }

  /**
   * Estimate skill complexity based on various factors
   */
  private estimateSkillComplexity(skill: Skill): number {
    // Factors that contribute to complexity
    const lengthFactor = Math.min(skill.content.length / 1000, 1); // Content length
    const protocolComplexity = skill.protocol ? Math.min(skill.protocol.length / 500, 1) : 0; // Protocol length
    const keywordCount = Math.min(skill.keywords.length / 10, 1); // Number of keywords
    const techAffinityCount = Math.min(skill.techAffinity.length / 5, 1); // Number of tech affinities

    return (lengthFactor * 0.3 + protocolComplexity * 0.4 + keywordCount * 0.15 + techAffinityCount * 0.15);
  }

  /**
   * Estimate skill effort/time required
   */
  private estimateSkillEffort(skill: Skill): number {
    // Based on the nature of the skill
    const effortIndicators = [
      'complex', 'advanced', 'sophisticated', 'multi-step', 'extensive',
      'detailed', 'thorough', 'comprehensive', 'in-depth'
    ];

    const effortWords = effortIndicators.filter(indicator =>
      skill.content.toLowerCase().includes(indicator) ||
      (skill.purpose && skill.purpose.toLowerCase().includes(indicator)) ||
      (skill.directives && skill.directives.toLowerCase().includes(indicator))
    );

    return Math.min(effortWords.length / effortIndicators.length, 1);
  }
}

/**
 * Utility class to recommend skills using the advanced scorer
 */
export class AdvancedSkillRecommender {
  private scorer: AdvancedSkillScorer;

  constructor() {
    this.scorer = new AdvancedSkillScorer();
  }

  /**
   * Recommend skills based on context using advanced scoring
   */
  recommendSkills(
    skills: Skill[],
    context: SkillScoringContext,
    minScore: number = 0.3,
    maxResults: number = 10
  ): SkillWithScore[] {
    // Calculate scores
    const scoredSkills = this.scorer.calculateScores(skills, context);

    // Filter by minimum score and sort by score descending
    return scoredSkills
      .filter(item => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Create a scoring context from a simple description
   */
  createContext(
    trackDescription: string,
    productContext: string = '',
    techStackContext: string = ''
  ): SkillScoringContext {
    return {
      trackPrompt: trackDescription,
      productContext,
      techStackContext
    };
  }
}