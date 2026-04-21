/**
 * Skill Feedback Loop System for Conductor
 * Collects, analyzes, and applies feedback to improve skill recommendations
 */

import type { Skill, SkillWithScore } from '../types';
import * as fs from 'fs';

export interface SkillFeedback {
  id: string; // Unique identifier for the feedback entry
  skillId: string; // ID of the skill being evaluated
  trackId: string; // ID of the track where the skill was used
  projectId: string; // ID of the project where the skill was used
  timestamp: string; // ISO string timestamp
  feedbackType: 'positive' | 'negative' | 'neutral' | 'improvement-suggestion';
  rating?: number; // Rating from 1-5
  comment?: string; // Optional detailed feedback
  context?: string; // Context where the skill was used
  outcome?: string; // Actual outcome when the skill was used
  effectiveness?: number; // Effectiveness score (0-1)
  usageDuration?: number; // Time spent using the skill in seconds
}

export interface SkillLearningData {
  skillId: string;
  totalActivations: number;
  positiveFeedback: number;
  negativeFeedback: number;
  averageRating: number;
  totalRatingSum: number;
  lastUsed: string; // ISO string timestamp
  successRate: number;
  improvementSuggestions: string[];
  effectivenessHistory: number[]; // Historical effectiveness scores
  usageDurationHistory: number[]; // Historical usage duration
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
  periodStart: string; // ISO string
  feedbackCount: number;
  averageRating: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface LearningConfiguration {
  feedbackWeight: number; // How much feedback affects scoring (0-1)
  recencyBias: number; // How much newer feedback is favored (0-1)
  minimumFeedbackThreshold: number; // Minimum feedback needed before adjustments
  learningRate: number; // How quickly to adjust based on feedback (0-1)
  effectivenessDecay: number; // How quickly effectiveness scores decay (0-1)
}

export class SkillFeedbackLoop {
  private feedbackStore: Map<string, SkillFeedback> = new Map();
  private learningData: Map<string, SkillLearningData> = new Map();
  private config: LearningConfiguration;
  private feedbackFilePath: string;

  constructor(
    feedbackFilePath: string,
    config: Partial<LearningConfiguration> = {}
  ) {
    this.config = {
      feedbackWeight: 0.3,
      recencyBias: 0.2,
      minimumFeedbackThreshold: 3,
      learningRate: 0.1,
      effectivenessDecay: 0.05,
      ...config
    };

    this.feedbackFilePath = feedbackFilePath;
    this.loadFeedbackFromStorage();
    this.loadLearningDataFromStorage();
  }

  /**
   * Submit feedback for a skill
   */
  async submitFeedback(feedback: Omit<SkillFeedback, 'id'>): Promise<void> {
    const feedbackEntry: SkillFeedback = {
      ...feedback,
      id: this.generateFeedbackId()
    };

    this.feedbackStore.set(feedbackEntry.id, feedbackEntry);

    // Update learning data
    await this.updateLearningData(feedbackEntry);

    // Persist to storage
    await this.saveFeedbackToStorage();
    await this.saveLearningDataToStorage();
  }

  /**
   * Generate a unique ID for feedback
   */
  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update learning data based on new feedback
   */
  private async updateLearningData(feedback: SkillFeedback): Promise<void> {
    const skillId = feedback.skillId;

    if (!this.learningData.has(skillId)) {
      this.learningData.set(skillId, {
        skillId,
        totalActivations: 0,
        positiveFeedback: 0,
        negativeFeedback: 0,
        averageRating: 0,
        totalRatingSum: 0,
        lastUsed: feedback.timestamp,
        successRate: 0,
        improvementSuggestions: [],
        effectivenessHistory: [],
        usageDurationHistory: []
      });
    }

    const learningData = this.learningData.get(skillId)!;

    // Update basic metrics
    learningData.totalActivations++;

    if (feedback.feedbackType === 'positive') {
      learningData.positiveFeedback++;
    } else if (feedback.feedbackType === 'negative') {
      learningData.negativeFeedback++;
    }

    // Update rating if provided
    if (feedback.rating !== undefined) {
      learningData.totalRatingSum += feedback.rating;
      learningData.averageRating = learningData.totalRatingSum / (learningData.positiveFeedback + learningData.negativeFeedback || 1);
    }

    // Update effectiveness if provided
    if (feedback.effectiveness !== undefined) {
      learningData.effectivenessHistory.push(feedback.effectiveness);
      // Keep only the last 20 effectiveness scores
      if (learningData.effectivenessHistory.length > 20) {
        learningData.effectivenessHistory.shift();
      }
    }

    // Update usage duration if provided
    if (feedback.usageDuration !== undefined) {
      learningData.usageDurationHistory.push(feedback.usageDuration);
      // Keep only the last 20 duration scores
      if (learningData.usageDurationHistory.length > 20) {
        learningData.usageDurationHistory.shift();
      }
    }

    // Update improvement suggestions
    if (feedback.comment && feedback.feedbackType === 'improvement-suggestion') {
      learningData.improvementSuggestions.push(feedback.comment);
    }

    // Calculate success rate
    const totalFeedback = learningData.positiveFeedback + learningData.negativeFeedback;
    learningData.successRate = totalFeedback > 0 ? learningData.positiveFeedback / totalFeedback : 0;

    // Update last used timestamp
    if (new Date(feedback.timestamp) > new Date(learningData.lastUsed)) {
      learningData.lastUsed = feedback.timestamp;
    }
  }

  /**
   * Adjust skill scores based on learning data
   */
  adjustSkillScores(skills: Skill[], _contextProjectId: string): SkillWithScore[] {
    const now = new Date();

    return skills.map(skill => {
      const learningData = this.learningData.get(skill.id);

      if (!learningData) {
        // No feedback yet, return neutral adjustment
        return { skill, score: 1.0 };
      }

      // Don't adjust scores if not enough feedback yet
      if (learningData.totalActivations < this.config.minimumFeedbackThreshold) {
        return { skill, score: 1.0 };
      }

      let adjustment = 1.0;

      // Apply success rate adjustment
      const successAdjustment = learningData.successRate;
      adjustment *= (1 - this.config.feedbackWeight) + (successAdjustment * this.config.feedbackWeight);

      // Apply rating adjustment
      if (learningData.averageRating > 0) {
        const ratingAdjustment = learningData.averageRating / 5; // Assuming 5-star rating
        adjustment *= (1 - this.config.feedbackWeight) + (ratingAdjustment * this.config.feedbackWeight);
      }

      // Apply recency bias - newer usage gets slight boost
      const lastUsedDate = new Date(learningData.lastUsed);
      const daysSinceUse = (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.exp(-daysSinceUse * this.config.recencyBias); // Decay over time
      adjustment *= recencyFactor;

      // Apply learning rate to smooth adjustments
      adjustment = 1 + (adjustment - 1) * this.config.learningRate;

      // Ensure adjustment is reasonable
      adjustment = Math.max(0.5, Math.min(1.5, adjustment));

      return { skill, score: adjustment };
    });
  }

  /**
   * Get aggregated feedback for a skill
   */
  getAggregatedFeedback(skillId: string): FeedbackAggregation | null {
    const feedbackEntries = Array.from(this.feedbackStore.values())
      .filter(fb => fb.skillId === skillId);

    if (feedbackEntries.length === 0) {
      return null;
    }

    // Calculate aggregates
    const totalFeedback = feedbackEntries.length;
    const positiveFeedback = feedbackEntries.filter(fb => fb.feedbackType === 'positive').length;
    // const negativeFeedback = feedbackEntries.filter(fb => fb.feedbackType === 'negative').length;

    const ratings = feedbackEntries.filter(fb => fb.rating !== undefined).map(fb => fb.rating!) as number[];
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    const successRate = totalFeedback > 0 ? positiveFeedback / totalFeedback : 0;

    // Extract common issues
    const issueKeywords = ['problem', 'difficulty', 'issue', 'trouble', 'challenging', 'bug'];
    const commonIssues = feedbackEntries
      .filter(fb => fb.comment && issueKeywords.some(keyword =>
        fb.comment!.toLowerCase().includes(keyword)))
      .map(fb => fb.comment!)
      .slice(0, 5); // Top 5 issues

    // Extract improvement suggestions
    const improvementSuggestions = feedbackEntries
      .filter(fb => fb.feedbackType === 'improvement-suggestion' && fb.comment)
      .map(fb => fb.comment!)
      .slice(0, 5); // Top 5 suggestions

    return {
      skillId,
      feedbackCount: totalFeedback,
      averageRating,
      successRate,
      commonIssues,
      improvementSuggestions,
      temporalPatterns: this.calculateTemporalPatterns(feedbackEntries)
    };
  }

  /**
   * Calculate temporal feedback patterns
   */
  private calculateTemporalPatterns(feedbackEntries: SkillFeedback[]): TemporalFeedbackPattern[] {
    // Group feedback by week
    const weeklyGroups = new Map<string, SkillFeedback[]>();

    for (const feedback of feedbackEntries) {
      const date = new Date(feedback.timestamp);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, []);
      }

      weeklyGroups.get(weekKey)!.push(feedback);
    }

    const patterns: TemporalFeedbackPattern[] = [];

    for (const [week, weekFeedback] of weeklyGroups) {
      const ratings = weekFeedback.filter(fb => fb.rating !== undefined).map(fb => fb.rating!) as number[];
      const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

      patterns.push({
        timePeriod: 'week',
        periodStart: week,
        feedbackCount: weekFeedback.length,
        averageRating: avgRating,
        trend: 'stable' // In a real implementation, we would calculate the actual trend
      });
    }

    return patterns;
  }

  /**
   * Decay older effectiveness scores
   */
  decayOldScores(): void {
    for (const [_skillId, learningData] of this.learningData) {
      // Apply decay to effectiveness history
      learningData.effectivenessHistory = learningData.effectivenessHistory
        .map(effectiveness => effectiveness * (1 - this.config.effectivenessDecay));

      // Apply decay to usage duration history (normalize differently)
      learningData.usageDurationHistory = learningData.usageDurationHistory
        .map(duration => duration * (1 - this.config.effectivenessDecay / 2));
    }
  }

  /**
   * Load feedback from storage
   */
  private loadFeedbackFromStorage(): void {
    try {
      if (fs.existsSync(this.feedbackFilePath)) {
        const data = fs.readFileSync(this.feedbackFilePath, 'utf8');
        const feedbackArray = JSON.parse(data) as SkillFeedback[];

        for (const feedback of feedbackArray) {
          this.feedbackStore.set(feedback.id, feedback);
        }
      }
    } catch (error) {
      console.warn('Could not load feedback from storage:', error);
    }
  }

  /**
   * Save feedback to storage
   */
  private async saveFeedbackToStorage(): Promise<void> {
    try {
      const feedbackArray = Array.from(this.feedbackStore.values());
      const data = JSON.stringify(feedbackArray, null, 2);
      fs.writeFileSync(this.feedbackFilePath, data);
    } catch (error) {
      console.error('Could not save feedback to storage:', error);
    }
  }

  /**
   * Load learning data from storage
   */
  private loadLearningDataFromStorage(): void {
    try {
      const learningDataPath = this.feedbackFilePath.replace('.json', '_learning.json');
      if (fs.existsSync(learningDataPath)) {
        const data = fs.readFileSync(learningDataPath, 'utf8');
        const learningDataArray = JSON.parse(data) as SkillLearningData[];

        for (const learningData of learningDataArray) {
          this.learningData.set(learningData.skillId, learningData);
        }
      }
    } catch (error) {
      console.warn('Could not load learning data from storage:', error);
    }
  }

  /**
   * Save learning data to storage
   */
  private async saveLearningDataToStorage(): Promise<void> {
    try {
      const learningDataPath = this.feedbackFilePath.replace('.json', '_learning.json');
      const learningDataArray = Array.from(this.learningData.values());
      const data = JSON.stringify(learningDataArray, null, 2);
      fs.writeFileSync(learningDataPath, data);
    } catch (error) {
      console.error('Could not save learning data to storage:', error);
    }
  }

  /**
   * Get learning data for a specific skill
   */
  getLearningData(skillId: string): SkillLearningData | undefined {
    return this.learningData.get(skillId);
  }

  /**
   * Get all learning data
   */
  getAllLearningData(): Map<string, SkillLearningData> {
    return new Map(this.learningData);
  }

  /**
   * Clear all feedback data (for testing or resets)
   */
  clearAllData(): void {
    this.feedbackStore.clear();
    this.learningData.clear();

    try {
      if (fs.existsSync(this.feedbackFilePath)) {
        fs.unlinkSync(this.feedbackFilePath);
      }

      const learningDataPath = this.feedbackFilePath.replace('.json', '_learning.json');
      if (fs.existsSync(learningDataPath)) {
        fs.unlinkSync(learningDataPath);
      }
    } catch (error) {
      console.error('Could not clear feedback storage:', error);
    }
  }

  /**
   * Get recommendation adjustments based on feedback for a specific project
   */
  getProjectAdjustedScores(
    skills: Skill[],
    projectId: string,
    originalScores: SkillWithScore[]
  ): SkillWithScore[] {
    // Apply project-specific learning adjustments
    const adjustedScores = this.adjustSkillScores(skills, projectId);

    // Combine with original scores
    return originalScores.map((original, index) => {
      const adjustment = adjustedScores[index]?.score || 1.0;
      const adjustedScore = original.score * adjustment;

      return {
        skill: original.skill,
        score: adjustedScore
      };
    });
  }
}