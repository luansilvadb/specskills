"use strict";
/**
 * Skill Composition System for Conductor
 * Enables composition and orchestration of multiple skills in custom workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeSkillRecommender = exports.SkillCompositionEngine = void 0;
// Internal utility to tokenize text for relevance scoring
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\sÀ-ÿ]/g, ' ') // Support Portuguese
        .split(/\s+/)
        .filter(word => word.length > 1); // Keep technical terms (UI, DB, AI, JS)
}
// Placeholder for SkillExecutionContext - now imported from types
// export interface SkillExecutionContext {
//   currentSkill: Skill;
//   allSkills: Skill[];
//   contextData: Record<string, any>;
//   parameters: Record<string, any>;
//   dependenciesResolved: boolean;
// }
class SkillCompositionEngine {
    constructor() {
        this.compositions = new Map();
    }
    /**
     * Register a new skill composition
     */
    registerComposition(composition) {
        this.compositions.set(composition.id, composition);
    }
    /**
     * Get a skill composition by ID
     */
    getComposition(id) {
        return this.compositions.get(id);
    }
    /**
     * Find compositions that match the given trigger conditions
     */
    findMatchingCompositions(triggerConditions) {
        return Array.from(this.compositions.values()).filter(comp => comp.triggerConditions.some(condition => triggerConditions.some(tc => tc.toLowerCase().includes(condition.toLowerCase()))));
    }
    /**
     * Execute a skill composition
     */
    async executeComposition(composition, context, parameters) {
        // Validate dependencies
        const unresolvedDeps = this.validateDependencies(composition);
        if (unresolvedDeps.length > 0) {
            throw new Error(`Unresolved dependencies for composition ${composition.id}: ${unresolvedDeps.join(', ')}`);
        }
        const results = { ...context };
        // Execute skills in the specified order
        for (const skillId of composition.executionOrder) {
            const skill = composition.skills.find(s => s.id === skillId);
            if (!skill) {
                throw new Error(`Skill ${skillId} not found in composition ${composition.id}`);
            }
            const executionContext = {
                skill: skill,
                currentSkill: skill,
                allSkills: composition.skills,
                contextData: results,
                parameters: parameters || {},
                availableSkills: composition.skills,
                dependenciesResolved: true
            };
            const result = await this.executeSingleSkill(executionContext);
            Object.assign(results, result);
        }
        return results;
    }
    /**
     * Execute a single skill in the context of a composition
     */
    async executeSingleSkill(context) {
        const { currentSkill, contextData, parameters } = context;
        const skill = currentSkill || context.skill; // Use currentSkill if available, otherwise fall back to skill
        // Apply skill directives to the context
        let updatedContext = { ...contextData };
        if (skill && skill.directives) {
            // Apply directives to modify the context or execution
            updatedContext = this.applyDirectives(skill.directives, updatedContext, parameters);
        }
        // If the skill has a protocol, execute it
        if (skill && skill.protocol) {
            updatedContext = await this.executeProtocol(skill.protocol, updatedContext);
        }
        return updatedContext;
    }
    /**
     * Apply directives to modify context or execution
     */
    applyDirectives(directives, context, _parameters) {
        // This is a simplified implementation
        // In a real implementation, directives would be parsed and executed accordingly
        const updatedContext = { ...context };
        // Example: If directives mention something about validation
        if (directives.toLowerCase().includes('validate')) {
            // Add validation results to context
            updatedContext.validationApplied = true;
        }
        if (directives.toLowerCase().includes('sanitize')) {
            // Add sanitization results to context
            updatedContext.sanitized = true;
        }
        return updatedContext;
    }
    /**
     * Execute a protocol string in the context
     */
    async executeProtocol(protocol, context) {
        // This is a simplified implementation
        // In a real implementation, this would parse and execute the protocol steps
        const updatedContext = { ...context };
        // Example: Parse protocol steps and execute them
        const steps = protocol.split('\n').filter(line => line.trim().startsWith('-'));
        for (const step of steps) {
            const trimmedStep = step.replace(/^-+\s*/, '').trim();
            // Simulate execution of the step
            if (trimmedStep.toLowerCase().includes('map') || trimmedStep.toLowerCase().includes('identify')) {
                updatedContext.mappingExecuted = true;
            }
            else if (trimmedStep.toLowerCase().includes('apply') || trimmedStep.toLowerCase().includes('execute')) {
                updatedContext.applicationExecuted = true;
            }
            else if (trimmedStep.toLowerCase().includes('verify') || trimmedStep.toLowerCase().includes('validate')) {
                updatedContext.verificationExecuted = true;
            }
        }
        return updatedContext;
    }
    /**
     * Validate that all dependencies are resolved
     */
    validateDependencies(composition) {
        const unresolved = [];
        for (const dep of composition.dependencies) {
            if (!this.compositions.has(dep)) {
                unresolved.push(dep);
            }
        }
        return unresolved;
    }
    /**
     * Create a composition from related skills
     */
    createCompositionFromSkills(id, name, description, skills, triggerConditions) {
        // Create dependency graph based on skill relationships
        const dependencies = [];
        const executionOrder = [];
        for (const skill of skills) {
            // Check if this skill has tech affinities that depend on other skills
            if (skill.techAffinity && skill.techAffinity.length > 0) {
                for (const affinity of skill.techAffinity) {
                    for (const otherSkill of skills) {
                        if (otherSkill !== skill &&
                            otherSkill.techAffinity &&
                            otherSkill.techAffinity.some(a => a.includes(affinity))) {
                            // Found potential dependency
                            dependencies.push(otherSkill.id);
                        }
                    }
                }
            }
        }
        // For now, use the order of skills as execution order
        // In a real implementation, this would be a topological sort based on dependencies
        executionOrder.push(...skills.map(skill => skill.id));
        return {
            id,
            name,
            description,
            skills,
            dependencies: [...new Set(dependencies)], // Remove duplicates
            executionOrder,
            triggerConditions
        };
    }
}
exports.SkillCompositionEngine = SkillCompositionEngine;
/**
 * Enhanced skill recommender that considers composition possibilities
 */
class CompositeSkillRecommender {
    constructor(engine) {
        this.compositionEngine = engine;
    }
    /**
     * Recommend individual skills and composite skill groups
     */
    recommendSkillsAndCompositions(contextDescription, allSkills) {
        // First, use the standard skill recommendation
        const tokens = tokenize(contextDescription);
        // Recommend individual skills based on token overlap
        const recommendedSkills = allSkills.map(skill => {
            let score = 0;
            // Score based on various skill properties
            if (tokens.some(token => skill.title.toLowerCase().includes(token))) {
                score += 10;
            }
            if (skill.purpose && tokens.some(token => skill.purpose.toLowerCase().includes(token))) {
                score += 8;
            }
            if (skill.keywords.some(keyword => tokens.includes(keyword.toLowerCase()))) {
                score += 5;
            }
            if (skill.techAffinity.some(affinity => tokens.includes(affinity.toLowerCase()))) {
                score += 7;
            }
            return { skill, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
        // Then, check for potential compositions based on recommended skills
        const potentialCompositions = this.findPotentialCompositions(recommendedSkills.map(rs => rs.skill));
        return {
            skills: recommendedSkills,
            compositions: potentialCompositions
        };
    }
    /**
     * Find potential compositions from recommended skills
     */
    findPotentialCompositions(skills) {
        // Identify common domains and create compositions for related skills
        const domainGroups = new Map();
        for (const skill of skills) {
            const domain = skill.domain.toLowerCase();
            if (!domainGroups.has(domain)) {
                domainGroups.set(domain, []);
            }
            domainGroups.get(domain)?.push(skill);
        }
        const compositions = [];
        // Create compositions for domains with multiple related skills
        for (const [domain, domainSkills] of domainGroups) {
            if (domainSkills.length > 1) {
                const composition = this.compositionEngine.createCompositionFromSkills(`comp-${domain.replace(/\s+/g, '-')}`, `${domain} Skills Composition`, `Composition of related ${domain} skills`, domainSkills, [domain, ...domainSkills.map(s => s.id)]);
                compositions.push(composition);
            }
        }
        return compositions;
    }
}
exports.CompositeSkillRecommender = CompositeSkillRecommender;
