"use strict";
/**
 * Skill Feedback Loop System for Conductor
 * Collects, analyzes, and applies feedback to improve skill recommendations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillFeedbackLoop = void 0;
const fs = __importStar(require("fs"));
class SkillFeedbackLoop {
    constructor(feedbackFilePath, config = {}) {
        this.feedbackStore = new Map();
        this.learningData = new Map();
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
    async submitFeedback(feedback) {
        const feedbackEntry = {
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
    generateFeedbackId() {
        return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Update learning data based on new feedback
     */
    async updateLearningData(feedback) {
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
        const learningData = this.learningData.get(skillId);
        // Update basic metrics
        learningData.totalActivations++;
        if (feedback.feedbackType === 'positive') {
            learningData.positiveFeedback++;
        }
        else if (feedback.feedbackType === 'negative') {
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
    adjustSkillScores(skills, _contextProjectId) {
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
    getAggregatedFeedback(skillId) {
        const feedbackEntries = Array.from(this.feedbackStore.values())
            .filter(fb => fb.skillId === skillId);
        if (feedbackEntries.length === 0) {
            return null;
        }
        // Calculate aggregates
        const totalFeedback = feedbackEntries.length;
        const positiveFeedback = feedbackEntries.filter(fb => fb.feedbackType === 'positive').length;
        // const negativeFeedback = feedbackEntries.filter(fb => fb.feedbackType === 'negative').length;
        const ratings = feedbackEntries.filter(fb => fb.rating !== undefined).map(fb => fb.rating);
        const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
        const successRate = totalFeedback > 0 ? positiveFeedback / totalFeedback : 0;
        // Extract common issues
        const issueKeywords = ['problem', 'difficulty', 'issue', 'trouble', 'challenging', 'bug'];
        const commonIssues = feedbackEntries
            .filter(fb => fb.comment && issueKeywords.some(keyword => fb.comment.toLowerCase().includes(keyword)))
            .map(fb => fb.comment)
            .slice(0, 5); // Top 5 issues
        // Extract improvement suggestions
        const improvementSuggestions = feedbackEntries
            .filter(fb => fb.feedbackType === 'improvement-suggestion' && fb.comment)
            .map(fb => fb.comment)
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
    calculateTemporalPatterns(feedbackEntries) {
        // Group feedback by week
        const weeklyGroups = new Map();
        for (const feedback of feedbackEntries) {
            const date = new Date(feedback.timestamp);
            const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            if (!weeklyGroups.has(weekKey)) {
                weeklyGroups.set(weekKey, []);
            }
            weeklyGroups.get(weekKey).push(feedback);
        }
        const patterns = [];
        for (const [week, weekFeedback] of weeklyGroups) {
            const ratings = weekFeedback.filter(fb => fb.rating !== undefined).map(fb => fb.rating);
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
    decayOldScores() {
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
    loadFeedbackFromStorage() {
        try {
            if (fs.existsSync(this.feedbackFilePath)) {
                const data = fs.readFileSync(this.feedbackFilePath, 'utf8');
                const feedbackArray = JSON.parse(data);
                for (const feedback of feedbackArray) {
                    this.feedbackStore.set(feedback.id, feedback);
                }
            }
        }
        catch (error) {
            console.warn('Could not load feedback from storage:', error);
        }
    }
    /**
     * Save feedback to storage
     */
    async saveFeedbackToStorage() {
        try {
            const feedbackArray = Array.from(this.feedbackStore.values());
            const data = JSON.stringify(feedbackArray, null, 2);
            fs.writeFileSync(this.feedbackFilePath, data);
        }
        catch (error) {
            console.error('Could not save feedback to storage:', error);
        }
    }
    /**
     * Load learning data from storage
     */
    loadLearningDataFromStorage() {
        try {
            const learningDataPath = this.feedbackFilePath.replace('.json', '_learning.json');
            if (fs.existsSync(learningDataPath)) {
                const data = fs.readFileSync(learningDataPath, 'utf8');
                const learningDataArray = JSON.parse(data);
                for (const learningData of learningDataArray) {
                    this.learningData.set(learningData.skillId, learningData);
                }
            }
        }
        catch (error) {
            console.warn('Could not load learning data from storage:', error);
        }
    }
    /**
     * Save learning data to storage
     */
    async saveLearningDataToStorage() {
        try {
            const learningDataPath = this.feedbackFilePath.replace('.json', '_learning.json');
            const learningDataArray = Array.from(this.learningData.values());
            const data = JSON.stringify(learningDataArray, null, 2);
            fs.writeFileSync(learningDataPath, data);
        }
        catch (error) {
            console.error('Could not save learning data to storage:', error);
        }
    }
    /**
     * Get learning data for a specific skill
     */
    getLearningData(skillId) {
        return this.learningData.get(skillId);
    }
    /**
     * Get all learning data
     */
    getAllLearningData() {
        return new Map(this.learningData);
    }
    /**
     * Clear all feedback data (for testing or resets)
     */
    clearAllData() {
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
        }
        catch (error) {
            console.error('Could not clear feedback storage:', error);
        }
    }
    /**
     * Get recommendation adjustments based on feedback for a specific project
     */
    getProjectAdjustedScores(skills, projectId, originalScores) {
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
exports.SkillFeedbackLoop = SkillFeedbackLoop;
