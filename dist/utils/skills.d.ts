import { Skill, SkillWithScore } from '../types';
import { SkillComposition } from './skillComposition';
/**
 * Load all skills from the skills directory and catalog
 */
export declare function loadAllSkills(skillsDir: string): Skill[];
/**
 * Parse a skill markdown file (Supports YAML Frontmatter and Standard Header)
 */
export declare function parseSkillFile(id: string, content: string): Skill | null;
/**
 * Discover and recommend skills using intelligent semantic matching
 * This function combines keyword matching with semantic understanding to identify relevant skills
 */
export declare function getRecommendedSkills(contextDescription: string, allSkills: Skill[]): SkillWithScore[];
/**
 * Find all active skills in a block of text using both pattern matching and semantic analysis
 * Option B: Global Scan with intelligent detection
 */
export declare function findActiveSkills(text: string, allSkills: Skill[]): Skill[];
/**
 * Find all active skills and compositions in a block of text
 */
export declare function findActiveSkillsAndCompositions(text: string, allSkills: Skill[], compositions?: SkillComposition[]): {
    skills: Skill[];
    compositions: SkillComposition[];
};
