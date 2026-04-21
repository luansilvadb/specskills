"use strict";
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
exports.loadAllSkills = loadAllSkills;
exports.parseSkillFile = parseSkillFile;
exports.getRecommendedSkills = getRecommendedSkills;
exports.findActiveSkills = findActiveSkills;
exports.findActiveSkillsAndCompositions = findActiveSkillsAndCompositions;
const path = __importStar(require("path"));
const fileSystem_1 = require("./fileSystem");
/**
 * Load all skills from the skills directory and catalog
 */
function loadAllSkills(skillsDir) {
    const skills = [];
    const catalogPath = path.join(skillsDir, 'catalog.md');
    const catalogContent = (0, fileSystem_1.fileExists)(catalogPath) ? (0, fileSystem_1.readFile)(catalogPath) : null;
    const catalogSignals = catalogContent ? parseSkillCatalog(catalogContent) : {};
    // 1. Load files from root
    const rootFiles = (0, fileSystem_1.listFiles)(skillsDir, '.md');
    for (const file of rootFiles) {
        if (file === 'index.md' || file === 'catalog.md')
            continue;
        const filePath = path.join(skillsDir, file);
        const content = (0, fileSystem_1.readFile)(filePath);
        if (content) {
            const id = path.basename(file, '.md');
            const skill = parseSkillFile(id, content);
            if (skill) {
                // Merge signals from catalog
                if (catalogSignals[id]) {
                    skill.keywords = [...new Set([...skill.keywords, ...catalogSignals[id]])];
                }
                skills.push(skill);
            }
        }
    }
    // 2. Load from subdirectories (folder/SKILL.md)
    const subdirs = (0, fileSystem_1.listDirectories)(skillsDir);
    for (const dir of subdirs) {
        const skillFilePath = path.join(skillsDir, dir, 'SKILL.md');
        const content = (0, fileSystem_1.readFile)(skillFilePath);
        if (content) {
            const id = dir; // Use folder name as ID
            const skill = parseSkillFile(id, content);
            if (skill) {
                // Merge signals from catalog
                if (catalogSignals[id]) {
                    skill.keywords = [...new Set([...skill.keywords, ...catalogSignals[id]])];
                }
                skills.push(skill);
            }
        }
    }
    return skills;
}
/**
 * Parse the skill catalog to extract detection signals
 */
function parseSkillCatalog(content) {
    const signals = {};
    // 1. Support for Section-based format (### SkillID)
    if (content.includes('### ')) {
        const sections = content.split(/\n###\s+/);
        for (const section of sections) {
            const lines = section.trim().split('\n');
            const id = lines[0].trim();
            if (!id)
                continue;
            const signalsLine = lines.find(l => l.includes('- **Signals**:'));
            if (signalsLine) {
                const signalStrings = signalsLine
                    .replace('- **Signals**:', '')
                    .split(',')
                    .map(s => s.trim().replace(/^`|`$/g, '').toLowerCase());
                signals[id] = signalStrings;
            }
        }
    }
    // 2. Support for Table-based format (| Skill Name | ... | Triggers |)
    if (content.includes('|')) {
        const lines = content.split('\n');
        for (const line of lines) {
            // Basic check if it's a data row (contains pipes and not just headers/separators)
            if (line.includes('|') && !line.includes('---') && !line.includes('Skill Name')) {
                const parts = line.split('|').map(p => p.trim());
                if (parts.length >= 5) {
                    // Format based on current catalog.md:
                    // | (0) | (1) **id** | (2) version | (3) description | (4) triggers | (5) path | (6) |
                    // Wait, splitting "| **id** | ..." gives ["", " **id** ", ...]
                    let id = parts[1].replace(/\*\*/g, '').trim();
                    let triggersStr = parts[4];
                    if (id && triggersStr) {
                        const triggerArray = triggersStr
                            .split(',')
                            .map(t => t.trim().replace(/^`|`$/g, '').toLowerCase())
                            .filter(t => t.length > 0);
                        if (signals[id]) {
                            signals[id] = [...new Set([...signals[id], ...triggerArray])];
                        }
                        else {
                            signals[id] = triggerArray;
                        }
                    }
                }
            }
        }
    }
    return signals;
}
/**
 * Parse a skill markdown file (Supports YAML Frontmatter and Standard Header)
 */
function parseSkillFile(id, content) {
    // 1. Extract YAML Frontmatter
    const yamlMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    let title = '';
    let trigger = `<skill: ${id}>`;
    let domain = 'General';
    let keywords = [];
    let techAffinity = [];
    let directives = '';
    let dependencies = [];
    let calls = [];
    if (yamlMatch) {
        const parsedYaml = parseYamlFrontmatter(yamlMatch[1]);
        title = parsedYaml.title || id;
        keywords = [...new Set([...keywords, ...parsedYaml.keywords])];
        techAffinity = [...new Set([...techAffinity, ...parsedYaml.techAffinity])];
        dependencies = [...new Set([...dependencies, ...parsedYaml.dependencies || []])];
        calls = [...new Set([...calls, ...parsedYaml.calls || []])];
    }
    // 2. Extract "Core Directives" section
    const directivesMatch = content.match(/## Core Directives\n([\s\S]+?)(?:\n##|$)/);
    if (directivesMatch)
        directives = directivesMatch[1].trim();
    // 3. Extract "Propósito" (Purpose)
    let purpose = '';
    const contentWithoutYAML = content.replace(/^---\r?\n[\s\S]+?\r?\n---/, '');
    const purposeMatch = contentWithoutYAML.match(/Propósito:\s*(.+)/i) ||
        contentWithoutYAML.match(/^>\s*(.+)/m);
    if (purposeMatch) {
        purpose = purposeMatch[1].trim().replace(/^["']|["']$/g, '');
    }
    // 4. Extract "Protocolo de Execução" (Protocol)
    let protocol = '';
    const protocolMatch = content.match(/(?:## Protocolo de Execução|## Protocol)\n([\s\S]+?)(?:\n##|$)/i);
    if (protocolMatch) {
        protocol = protocolMatch[1].trim();
    }
    // 5. Look for skill calls within the protocol section (declarative calls)
    if (protocol) {
        // Find patterns like <skill: skill-id> or [[skill: skill-id]]
        const skillCallMatches = protocol.matchAll(/(?:<|\[\[)skill:\s*([a-z0-9-]+)\s*(?:>|\]\])/gi);
        for (const match of skillCallMatches) {
            if (!calls.includes(match[1])) {
                calls.push(match[1]);
            }
        }
        // Also look for composition calls
        const compositionCallMatches = protocol.matchAll(/(?:<|\[\[)composition:\s*([a-z0-9-]+)\s*(?:>|\]\])/gi);
        for (const match of compositionCallMatches) {
            if (!calls.includes(match[1])) {
                calls.push(match[1]);
            }
        }
    }
    // 6. Fallback to standard Markdown parsing if YAML didn't provide title
    if (!title) {
        const titleHeaderMatch = content.match(/^# (.+)$/m);
        if (titleHeaderMatch)
            title = titleHeaderMatch[1].trim().replace(/^Skill:\s*/i, '');
        // Legacy support
        const legacyTitleMatch = content.match(/^# Skill:\s*(.+)$/m);
        if (!title && legacyTitleMatch)
            title = legacyTitleMatch[1].trim();
    }
    // 7. Default title if still missing
    if (!title)
        title = id;
    // 8. Additional Metadata
    const legacyTriggerMatch = content.match(/\*\*Trigger:\*\*\s*(<skill:\s*(.+?)\s*>)/i);
    if (legacyTriggerMatch)
        trigger = legacyTriggerMatch[1].trim();
    const legacyKeywordsMatch = content.match(/\*\*Keywords:\*\*\s*(.+)$/m);
    if (legacyKeywordsMatch) {
        const legacyKeywords = legacyKeywordsMatch[1].split(',').map(k => k.trim().toLowerCase());
        keywords = [...new Set([...keywords, ...legacyKeywords])];
    }
    const domainMatch = content.match(/\*\*Domain:\*\*\s*(.+)$/m);
    if (domainMatch)
        domain = domainMatch[1].trim();
    return {
        id,
        title,
        trigger,
        domain,
        keywords,
        techAffinity,
        directives,
        purpose,
        protocol,
        content,
        dependencies,
        calls
    };
}
/**
 * Parse YAML frontmatter from skill file
 */
function parseYamlFrontmatter(yamlContent) {
    let title = '';
    let keywords = [];
    let techAffinity = [];
    let dependencies = [];
    let calls = [];
    const yamlLines = yamlContent.split(/\r?\n/);
    let inTriggers = false;
    let inTechAffinity = false;
    let inDependencies = false;
    let inCalls = false;
    let descriptionLines = [];
    let inDescription = false;
    for (const line of yamlLines) {
        if (line.startsWith('name:')) {
            title = line.replace('name:', '').trim();
            inTriggers = false;
            inTechAffinity = false;
            inDependencies = false;
            inCalls = false;
            inDescription = false;
        }
        else if (line.startsWith('triggers:')) {
            inTriggers = true;
            inTechAffinity = false;
            inDependencies = false;
            inCalls = false;
            inDescription = false;
        }
        else if (line.startsWith('tech_affinity:')) {
            inTechAffinity = true;
            inTriggers = false;
            inDependencies = false;
            inCalls = false;
            inDescription = false;
        }
        else if (line.startsWith('dependencies:')) {
            inDependencies = true;
            inTriggers = false;
            inTechAffinity = false;
            inCalls = false;
            inDescription = false;
        }
        else if (line.startsWith('calls:')) {
            inCalls = true;
            inTriggers = false;
            inTechAffinity = false;
            inDependencies = false;
            inDescription = false;
        }
        else if (line.startsWith('description:')) {
            inDescription = true;
            inTriggers = false;
            inTechAffinity = false;
            inDependencies = false;
            inCalls = false;
        }
        else if (inTriggers && line.trim().startsWith('-')) {
            const t = line.trim().replace(/^-\s*["']?|["']?$/g, '').trim();
            if (t)
                keywords.push(t);
        }
        else if (inTechAffinity && line.trim().startsWith('-')) {
            const t = line.trim().replace(/^-\s*["']?|["']?$/g, '').trim();
            if (t)
                techAffinity.push(t);
        }
        else if (inDependencies && line.trim().startsWith('-')) {
            const t = line.trim().replace(/^-\s*["']?|["']?$/g, '').trim();
            if (t)
                dependencies.push(t);
        }
        else if (inCalls && line.trim().startsWith('-')) {
            const t = line.trim().replace(/^-\s*["']?|["']?$/g, '').trim();
            if (t)
                calls.push(t);
        }
        else if (inDescription && (line.startsWith(' ') || line.trim() === '')) {
            descriptionLines.push(line.trim());
        }
        else if (line.trim() !== '') {
            inTriggers = false;
            inDependencies = false;
            inCalls = false;
            inDescription = false;
        }
    }
    return { title, keywords, techAffinity, dependencies, calls };
}
/**
 * Internal utility to tokenize text for relevance scoring
 */
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s\u00C0-\u00FF]/g, ' ') // Support Portuguese
        .split(/\s+/)
        .filter(word => word.length > 1); // Keep technical terms (UI, DB, AI, JS)
}
/**
 * Calculates a relevance score for a skill based on full-text overlap
 */
function calculateRelevance(skill, trackTokens, productTokens, techTokens) {
    let score = 0;
    // Weights for different sections
    const WEIGHTS = {
        TITLE: 20,
        PURPOSE: 10,
        KEYWORDS: 5,
        DIRECTIVES: 3,
        CONTENT: 1,
        TECH_AFFINITY: 8
    };
    const titleTokens = tokenize(skill.title);
    const purposeTokens = tokenize(skill.purpose || '');
    const keywordTokens = skill.keywords.flatMap(k => tokenize(k));
    const directiveTokens = tokenize(skill.directives || '');
    const contentTokens = tokenize(skill.content);
    // 1. Check Track Prompt overlap (Primary Intention)
    for (const token of trackTokens) {
        if (titleTokens.includes(token))
            score += WEIGHTS.TITLE;
        if (purposeTokens.includes(token))
            score += WEIGHTS.PURPOSE;
        if (keywordTokens.includes(token))
            score += WEIGHTS.KEYWORDS;
        if (directiveTokens.includes(token))
            score += WEIGHTS.DIRECTIVES;
        if (contentTokens.includes(token))
            score += WEIGHTS.CONTENT;
    }
    // 2. Check Tech Affinity overlap (Contextual relevance)
    for (const tech of techTokens) {
        if (skill.techAffinity.some(a => a.toLowerCase() === tech)) {
            score += WEIGHTS.TECH_AFFINITY;
        }
    }
    // 3. Check Product Context overlap (Secondary relevance)
    for (const token of productTokens) {
        if (purposeTokens.includes(token))
            score += WEIGHTS.PURPOSE / 2;
        if (titleTokens.includes(token))
            score += WEIGHTS.TITLE / 4;
    }
    return score;
}
/**
 * Discover and recommend skills using intelligent semantic matching
 * This function combines keyword matching with semantic understanding to identify relevant skills
 */
function getRecommendedSkills(contextDescription, allSkills) {
    const parts = contextDescription.split('\n');
    const trackPrompt = parts[0] || '';
    const productContext = parts[1] || '';
    const techStackContext = parts[2] || '';
    // Calculate traditional relevance scores
    const trackTokens = tokenize(trackPrompt);
    const productTokens = tokenize(productContext);
    const techTokens = tokenize(techStackContext);
    const traditionalScores = allSkills.map(skill => {
        const score = calculateRelevance(skill, trackTokens, productTokens, techTokens);
        return { skill, traditionalScore: score };
    });
    // Calculate semantic relevance scores
    const semanticScores = calculateSemanticRelevance(contextDescription, allSkills);
    // Combine both scores with weights
    const combinedScores = traditionalScores.map((item, idx) => {
        const semanticScore = semanticScores[idx]?.score || 0;
        // Weight semantic scoring higher to improve discovery for non-technical users
        const combinedScore = (item.traditionalScore * 0.4) + (semanticScore * 0.6);
        return {
            skill: item.skill,
            score: combinedScore
        };
    });
    // Filter skills with score > 1.5 (lowered threshold to accommodate semantic matching)
    return combinedScores
        .filter(item => item.score > 1.5)
        .sort((a, b) => b.score - a.score);
}
/**
 * Calculate semantic relevance based on deeper understanding of context
 */
function calculateSemanticRelevance(contextDescription, allSkills) {
    const context = contextDescription.toLowerCase();
    // Extract semantic segments
    const segments = {
        task: extractTaskSegment(context),
        technology: extractTechnologySegment(context),
        requirements: extractRequirementsSegment(context),
        constraints: extractConstraintsSegment(context)
    };
    return allSkills.map(skill => {
        const score = calculateDeepSemanticRelevance(skill, segments);
        return { skill, score };
    });
}
/**
 * Extract the main task or goal from the context
 */
function extractTaskSegment(context) {
    // Match common action words followed by the main goal
    const taskRegex = /(criar|fazer|desenvolver|implementar|construir|montar|desenhar|fazer\s+um\s+clone\s+de|criar\s+um\s+jogo\s+de|construir\s+um\s+sistema\s+de)/i;
    const goalRegex = /(jogo|aplicativo|sistema|clone|pagina|tela|interface|app|web\s+app|site|programa|software)/i;
    // Extract the main action-goal combination
    const actionMatch = context.match(taskRegex);
    const goalMatch = context.match(goalRegex);
    if (actionMatch && goalMatch) {
        // Find the text between action and goal
        const actionIndex = context.indexOf(actionMatch[0]);
        const goalIndex = context.indexOf(goalMatch[0]);
        const between = context.substring(Math.min(actionIndex, goalIndex), Math.max(actionIndex, goalIndex) + (goalMatch[0].length));
        return `${actionMatch[0]} ${between} ${goalMatch[0]}`.trim();
    }
    // Fallback: return the first 100 characters
    return context.substring(0, 100);
}
/**
 * Extract technology-related keywords from context
 */
function extractTechnologySegment(context) {
    // Match technology terms
    const techTerms = [
        'html', 'css', 'js', 'javascript', 'three', 'threejs', 'three\\.js',
        'react', 'vue', 'angular', 'typescript', 'node', 'backend', 'frontend',
        'webgl', 'canvas', '2d', '3d', 'engine', 'game', 'render', 'physics'
    ];
    const matches = [];
    for (const term of techTerms) {
        const regex = new RegExp(term, 'gi');
        const found = context.match(regex);
        if (found) {
            matches.push(...found);
        }
    }
    return [...new Set(matches)].join(' ');
}
/**
 * Extract requirement keywords from context
 */
function extractRequirementsSegment(context) {
    const requirementKeywords = [
        'simples', 'básico', 'avançado', 'responsivo', 'performático', 'seguro',
        'escalável', 'rápido', 'limpo', 'bom', 'ótimo', 'melhor', 'eficiente',
        'bonito', 'moderno', 'profissional', 'mobile', 'desktop', 'web', 'pwa',
        'offline', 'online', 'realtime', 'interativo', 'animado', 'suave'
    ];
    return requirementKeywords.filter(kw => context.includes(kw)).join(' ');
}
/**
 * Extract constraint keywords from context
 */
function extractConstraintsSegment(context) {
    const constraintKeywords = [
        'simples', 'fácil', 'rápido', 'barato', 'pequeno', 'leve', 'básico',
        'sem complexidade', 'não muito difícil', 'apenas funcional',
        'puro', 'sem frameworks', 'somente', 'apenas', 'só', 'unicamente'
    ];
    return constraintKeywords.filter(kw => context.includes(kw)).join(' ');
}
/**
 * Calculate deep semantic relevance considering multiple factors
 */
function calculateDeepSemanticRelevance(skill, segments) {
    let score = 0;
    // Domain relevance
    if (segments.task.includes('jogo') && skill.domain.toLowerCase().includes('frontend')) {
        score += 20;
    }
    // Technology matching
    const techMatches = skill.techAffinity.filter(tech => segments.technology.toLowerCase().includes(tech.toLowerCase())).length;
    score += techMatches * 8;
    // Semantic matching with purpose
    if (skill.purpose) {
        const purposeScore = calculateTextSimilarity(segments.task + ' ' + segments.requirements, skill.purpose.toLowerCase());
        score += purposeScore * 15;
    }
    // Semantic matching with title
    const titleScore = calculateTextSimilarity(segments.task, skill.title.toLowerCase());
    score += titleScore * 10;
    // Semantic matching with keywords (more lenient)
    const keywordMatches = skill.keywords.filter(keyword => {
        // Check for partial matches and related terms
        const keywordLower = keyword.toLowerCase();
        return segments.task.includes(keywordLower) ||
            segments.requirements.includes(keywordLower) ||
            calculateTextSimilarity(segments.task, keywordLower) > 0.3;
    }).length;
    score += keywordMatches * 5;
    // Boost for general frontend skills if HTML/CSS/JS mentioned
    if (segments.technology.includes('html') || segments.technology.includes('css') || segments.technology.includes('js')) {
        if (skill.domain.toLowerCase().includes('frontend') || skill.techAffinity.some(tech => ['html', 'css', 'javascript'].includes(tech.toLowerCase()))) {
            score += 15;
        }
    }
    return score;
}
/**
 * Calculate semantic similarity between texts using a combination of methods
 */
function calculateTextSimilarity(text1, text2) {
    // Tokenize both texts
    const tokens1 = tokenize(text1);
    const tokens2 = tokenize(text2);
    if (tokens1.length === 0 || tokens2.length === 0) {
        return 0;
    }
    // Calculate Jaccard similarity (intersection over union)
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = [...set1].filter(x => set2.has(x)).length;
    const union = new Set([...tokens1, ...tokens2]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    // Calculate containment (how much of text2 is contained in text1)
    const contained = tokens2.filter(token => tokens1.includes(token)).length / tokens2.length;
    // Combine both measures
    return (jaccard * 0.7) + (contained * 0.3);
}
/**
 * Find all active skills in a block of text using both pattern matching and semantic analysis
 * Option B: Global Scan with intelligent detection
 */
function findActiveSkills(text, allSkills) {
    // First, find skills using traditional pattern matching
    const foundIds = findSkillIdsInText(text, allSkills);
    const traditionalMatches = getActiveSkillsById(foundIds, allSkills);
    // Then, use semantic analysis to find additional relevant skills
    const semanticMatches = discoverSemanticSkills(text, allSkills);
    // Combine both results, avoiding duplicates
    const allMatchedSkills = new Map();
    // Add traditional matches
    traditionalMatches.forEach(skill => {
        allMatchedSkills.set(skill.id, skill);
    });
    // Add semantic matches if they're not already included
    semanticMatches.forEach(skill => {
        if (!allMatchedSkills.has(skill.id)) {
            allMatchedSkills.set(skill.id, skill);
        }
    });
    return Array.from(allMatchedSkills.values());
}
/**
 * Discover skills using semantic analysis of the text
 */
function discoverSemanticSkills(text, allSkills) {
    // Use the same semantic analysis as the recommendation function
    const semanticScores = calculateSemanticRelevance(text, allSkills);
    // Filter skills with sufficient semantic score
    return semanticScores
        .filter(item => item.score > 8) // Adjust threshold as needed
        .map(item => item.skill);
}
/**
 * Find all active skills and compositions in a block of text
 */
function findActiveSkillsAndCompositions(text, allSkills, compositions = []) {
    // Find individual skills using enhanced detection
    const skills = findActiveSkills(text, allSkills);
    // Find compositions
    const activeCompositions = findActiveCompositions(text, compositions);
    return { skills, compositions: activeCompositions };
}
/**
 * Find active compositions based on trigger conditions
 */
function findActiveCompositions(text, compositions) {
    const lowerText = text.toLowerCase();
    return compositions.filter(comp => comp.triggerConditions.some(condition => lowerText.includes(condition.toLowerCase())));
}
/**
 * Find skill IDs in text using various patterns
 */
function findSkillIdsInText(text, allSkills) {
    const foundIds = new Set();
    const skillIds = allSkills.map(s => s.id.toLowerCase());
    // 1. Match Standard Tags: <skill: id> or [[skill: id]]
    const tagRegex = /(?:<|\[\[)skill:\s*([a-z0-9-]+)\s*(?:>|\]\])/gi;
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        foundIds.add(match[1].toLowerCase());
    }
    // 2. Match Bold Declarations: **Skill: id1, id2**
    const boldRegex = /\*\*(?:Skills?|Mindsets?):\s*([^\*]+)\*\*/gi;
    while ((match = boldRegex.exec(text)) !== null) {
        const ids = match[1].split(/[,/|\s]+/).map(id => id.trim().toLowerCase());
        ids.forEach(id => {
            // Clean possible tag remnants from the capture
            const cleanId = id.replace(/<skill:\s*|>|\[\[|\]\]/gi, '').trim();
            if (skillIds.includes(cleanId))
                foundIds.add(cleanId);
        });
    }
    // 3. Match List Mindsets: - [ ] Mindset: <skill: id> or - [ ] Mindset: id
    const listRegex = /-\s*\[[ x~]\]\s*(?:Skill|Mindset):\s*(?:<skill:\s*)?([a-z0-9-]+)/gi;
    while ((match = listRegex.exec(text)) !== null) {
        foundIds.add(match[1].toLowerCase());
    }
    // 4. Match Header Mindsets: ### id or ### Mindset: id (Robust version)
    const headerLines = text.match(/^#{3}\s+.+$/gm) || [];
    headerLines.forEach(line => {
        const rawTitle = line.replace(/^#{3}\s*/, '')
            .replace(/^(?:Skill|Mindset):\s*/i, '')
            .trim();
        // Try matching both original and slugified version
        const slugified = rawTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const cleanId = rawTitle.toLowerCase().trim();
        if (skillIds.includes(slugified))
            foundIds.add(slugified);
        else if (skillIds.includes(cleanId))
            foundIds.add(cleanId);
    });
    return foundIds;
}
/**
 * Get active skills by found IDs
 */
function getActiveSkillsById(foundIds, allSkills) {
    const activeSkills = [];
    for (const skill of allSkills) {
        if (foundIds.has(skill.id.toLowerCase())) {
            activeSkills.push(skill);
        }
    }
    return activeSkills;
}
