import * as path from 'path';
import { Skill, SkillWithScore } from '../types';
import { listFiles, listDirectories, readFile, fileExists } from './fileSystem';
import { SkillComposition } from './skillComposition';

/**
 * Load all skills from the skills directory and catalog
 */
export function loadAllSkills(skillsDir: string): Skill[] {
  const skills: Skill[] = [];
  const catalogPath = path.join(skillsDir, 'catalog.md');
  const catalogContent = fileExists(catalogPath) ? readFile(catalogPath) : null;
  const catalogSignals = catalogContent ? parseSkillCatalog(catalogContent) : {};

  // 1. Load files from root
  const rootFiles = listFiles(skillsDir, '.md');
  for (const file of rootFiles) {
    if (file === 'index.md' || file === 'catalog.md') continue;
    const filePath = path.join(skillsDir, file);
    const content = readFile(filePath);
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
  const subdirs = listDirectories(skillsDir);
  for (const dir of subdirs) {
    const skillFilePath = path.join(skillsDir, dir, 'SKILL.md');
    const content = readFile(skillFilePath);
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
function parseSkillCatalog(content: string): Record<string, string[]> {
  const signals: Record<string, string[]> = {};

  // 1. Support for Section-based format (### SkillID)
  parseSectionBasedFormat(content, signals);

  // 2. Support for Table-based format (| Skill Name | ... | Triggers |)
  parseTableBasedFormat(content, signals);

  return signals;
}

/**
 * Parse section-based format of skill catalog
 */
function parseSectionBasedFormat(content: string, signals: Record<string, string[]>): void {
  if (content.includes('### ')) {
    const sections = content.split(/\n###\s+/);
    for (const section of sections) {
      const lines = section.trim().split('\n');
      const id = lines[0].trim();
      if (!id) continue;

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
}

/**
 * Parse table-based format of skill catalog
 */
function parseTableBasedFormat(content: string, signals: Record<string, string[]>): void {
  if (!content.includes('|')) return;

  const lines = content.split('\n');
  for (const line of lines) {
    // Basic check if it's a data row (contains pipes and not just headers/separators)
    if (line.includes('|') && !line.includes('---') && !line.includes('Skill Name')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 5) {
        // Format based on current catalog.md:
        // | (0) | (1) **id** | (2) version | (3) description | (4) triggers | (5) path | (6) |

        const id = parts[1].replace(/\*\*/g, '').trim();
        const triggersStr = parts[4];

        if (id && triggersStr) {
          const triggerArray = triggersStr
            .split(',')
            .map(t => t.trim().replace(/^`|`$/g, '').toLowerCase())
            .filter(t => t.length > 0);

          if (signals[id]) {
            signals[id] = [...new Set([...signals[id], ...triggerArray])];
          } else {
            signals[id] = triggerArray;
          }
        }
      }
    }
  }
}

/**
 * Parse a skill markdown file (Supports YAML Frontmatter and Standard Header)
 */
export function parseSkillFile(id: string, content: string): Skill | null {
  // 1. Extract YAML Frontmatter
  const yamlMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  let title = '';
  let trigger = `<skill: ${id}>`;
  let domain = 'General';
  let keywords: string[] = [];
  let techAffinity: string[] = [];
  let directives = '';
  let dependencies: string[] = [];
  let calls: string[] = [];

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
  if (directivesMatch) directives = directivesMatch[1].trim();

  // 3. Extract "Propósito" (Purpose)
  let purpose = '';
  const contentWithoutYAML = content.replace(/^---\r?\n[\s\S]+?\r?\n---/, '');

  const purposeMatch =
    contentWithoutYAML.match(/Propósito:\s*(.+)/i) ||
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
    if (titleHeaderMatch) title = titleHeaderMatch[1].trim().replace(/^Skill:\s*/i, '');

    // Legacy support
    const legacyTitleMatch = content.match(/^# Skill:\s*(.+)$/m);
    if (!title && legacyTitleMatch) title = legacyTitleMatch[1].trim();
  }

  // 7. Default title if still missing
  if (!title) title = id;

  // 8. Additional Metadata
  const legacyTriggerMatch = content.match(/\*\*Trigger:\*\*\s*(<skill:\s*(.+?)\s*>)/i);
  if (legacyTriggerMatch) trigger = legacyTriggerMatch[1].trim();

  const legacyKeywordsMatch = content.match(/\*\*Keywords:\*\*\s*(.+)$/m);
  if (legacyKeywordsMatch) {
    const legacyKeywords = legacyKeywordsMatch[1].split(',').map(k => k.trim().toLowerCase());
    keywords = [...new Set([...keywords, ...legacyKeywords])];
  }

  const domainMatch = content.match(/\*\*Domain:\*\*\s*(.+)$/m);
  if (domainMatch) domain = domainMatch[1].trim();

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
function parseYamlFrontmatter(yamlContent: string): { title: string, keywords: string[], techAffinity: string[], dependencies?: string[], calls?: string[] } {
  const keywords: string[] = [];
  const techAffinity: string[] = [];
  const dependencies: string[] = [];
  const calls: string[] = [];

  type YamlParseState = {
    title: string;
    inTriggers: boolean;
    inTechAffinity: boolean;
    inDependencies: boolean;
    inCalls: boolean;
  };

  const yamlLines = yamlContent.split(/\r?\n/);
  const parsingState: YamlParseState = {
    title: '',
    inTriggers: false,
    inTechAffinity: false,
    inDependencies: false,
    inCalls: false
  };

  for (const line of yamlLines) {
    updateParsingState(line, parsingState);
    handleListItem(line, parsingState, keywords, techAffinity, dependencies, calls);
    resetParsingStateOnNewSection(line, parsingState);
  }

  return { title: parsingState.title, keywords, techAffinity, dependencies, calls };
}

/**
 * Update parsing state based on the current line
 */
function updateParsingState(line: string, state: { title: string; inTriggers: boolean; inTechAffinity: boolean; inDependencies: boolean; inCalls: boolean }): void {
  if (line.startsWith('name:')) {
    state.title = line.replace('name:', '').trim();
    resetAllFlags(state);
  } else if (line.startsWith('triggers:')) {
    state.inTriggers = true;
    resetOtherFlags(state, 'inTriggers');
  } else if (line.startsWith('tech_affinity:')) {
    state.inTechAffinity = true;
    resetOtherFlags(state, 'inTechAffinity');
  } else if (line.startsWith('dependencies:')) {
    state.inDependencies = true;
    resetOtherFlags(state, 'inDependencies');
  } else if (line.startsWith('calls:')) {
    state.inCalls = true;
    resetOtherFlags(state, 'inCalls');
  }
}

/**
 * Handle list items based on the current parsing state
 */
function handleListItem(
  line: string,
  state: { inTriggers: boolean; inTechAffinity: boolean; inDependencies: boolean; inCalls: boolean },
  keywords: string[],
  techAffinity: string[],
  dependencies: string[],
  calls: string[]
): void {
  if (state.inTriggers && line.trim().startsWith('-')) {
    const t = line.trim().replace(/^-\s*["']?|["']?$/g, '').trim();
    if (t) keywords.push(t);
  } else if (state.inTechAffinity && line.trim().startsWith('-')) {
    const t = line.trim().replace(/^-\s*["']?|["']?$/g, '').trim();
    if (t) techAffinity.push(t);
  } else if (state.inDependencies && line.trim().startsWith('-')) {
    const t = line.trim().replace(/^-\s*["']?|["']?$/g, '').trim();
    if (t) dependencies.push(t);
  } else if (state.inCalls && line.trim().startsWith('-')) {
    const t = line.trim().replace(/^-\s*["']?|["']?$/g, '').trim();
    if (t) calls.push(t);
  }
}

/**
 * Reset parsing flags when encountering a new section
 */
function resetParsingStateOnNewSection(
  line: string,
  state: { inTriggers: boolean; inTechAffinity: boolean; inDependencies: boolean; inCalls: boolean }
): void {
  if (line.trim() !== '') {
    if (!line.startsWith('triggers:') && !line.startsWith('tech_affinity:') &&
        !line.startsWith('dependencies:') && !line.startsWith('calls:')) {
      resetAllFlags(state);
    }
  }
}

/**
 * Reset all parsing flags
 */
function resetAllFlags(state: { inTriggers: boolean; inTechAffinity: boolean; inDependencies: boolean; inCalls: boolean }): void {
  state.inTriggers = false;
  state.inTechAffinity = false;
  state.inDependencies = false;
  state.inCalls = false;
}

/**
 * Reset all flags except the specified one
 */
function resetOtherFlags(
  state: { inTriggers: boolean; inTechAffinity: boolean; inDependencies: boolean; inCalls: boolean },
  keepFlag: 'inTriggers' | 'inTechAffinity' | 'inDependencies' | 'inCalls'
): void {
  const flags: Array<'inTriggers' | 'inTechAffinity' | 'inDependencies' | 'inCalls'> = [
    'inTriggers',
    'inTechAffinity',
    'inDependencies',
    'inCalls',
  ];
  for (const flag of flags) {
    if (flag !== keepFlag) {
      state[flag] = false;
    }
  }
}

/**
 * Internal utility to tokenize text for relevance scoring
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\sÀ-ÿ]/g, ' ') // Support Portuguese
    .split(/\s+/)
    .filter(word => word.length > 1); // Keep technical terms (UI, DB, AI, JS)
}

/**
 * Calculates a relevance score for a skill based on full-text overlap
 */
function calculateRelevance(skill: Skill, trackTokens: string[], productTokens: string[], techTokens: string[]): number {
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
  const keywordTokens = (skill.keywords ?? []).flatMap(k => tokenize(k));
  const directiveTokens = tokenize(skill.directives || '');
  const contentTokens = tokenize(skill.content);

  // 1. Check Track Prompt overlap (Primary Intention)
  for (const token of trackTokens) {
    if (titleTokens.includes(token)) score += WEIGHTS.TITLE;
    if (purposeTokens.includes(token)) score += WEIGHTS.PURPOSE;
    if (keywordTokens.includes(token)) score += WEIGHTS.KEYWORDS;
    if (directiveTokens.includes(token)) score += WEIGHTS.DIRECTIVES;
    if (contentTokens.includes(token)) score += WEIGHTS.CONTENT;
  }

  // 2. Check Tech Affinity overlap (Contextual relevance)
  for (const tech of techTokens) {
    if ((skill.techAffinity ?? []).some(a => a.toLowerCase() === tech)) {
      score += WEIGHTS.TECH_AFFINITY;
    }
  }

  // 3. Check Product Context overlap (Secondary relevance)
  for (const token of productTokens) {
    if (purposeTokens.includes(token)) score += WEIGHTS.PURPOSE / 2;
    if (titleTokens.includes(token)) score += WEIGHTS.TITLE / 4;
  }

  return score;
}

/**
 * Discover and recommend skills using intelligent semantic matching
 * This function combines keyword matching with semantic understanding to identify relevant skills
 */
export function getRecommendedSkills(contextDescription: string, allSkills: Skill[]): SkillWithScore[] {
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

  // Filter skills with score > 0.5 (standard threshold for keyword matching)
  return combinedScores
    .filter(item => item.score > 0.5)
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate semantic relevance based on deeper understanding of context
 */
function calculateSemanticRelevance(contextDescription: string, allSkills: Skill[]): { skill: Skill, score: number }[] {
  const context = contextDescription.toLowerCase();

  type SemanticSegments = {
    task: string;
    technology: string;
    requirements: string;
    constraints: string;
  };

  // Extract semantic segments
  const segments: SemanticSegments = {
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
function extractTaskSegment(context: string): string {
  if (!context) return '';
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
function extractTechnologySegment(context: string): string {
  if (!context) return '';
  // Match technology terms
  const techTerms = [
    'html', 'css', 'js', 'javascript', 'three', 'threejs', 'three\\.js',
    'react', 'vue', 'angular', 'typescript', 'node', 'backend', 'frontend',
    'webgl', 'canvas', '2d', '3d', 'engine', 'game', 'render', 'physics'
  ];

  const matches: string[] = [];
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
function extractRequirementsSegment(context: string): string {
  if (!context) return '';
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
function extractConstraintsSegment(context: string): string {
  if (!context) return '';
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
function calculateDeepSemanticRelevance(
  skill: Skill,
  segments: { task: string; technology: string; requirements: string; constraints: string }
): number {
  let score = 0;

  // Calculate scores for each segment
  score += calculateDomainScore(segments, skill);
  score += calculateTechnologyScore(segments, skill);
  score += calculatePurposeScore(segments, skill);
  score += calculateTitleScore(segments, skill);
  score += calculateKeywordScore(segments, skill);
  score += calculateFrontendBoostScore(segments, skill);

  return score;
}

/**
 * Calculate domain relevance score
 */
function calculateDomainScore(
  segments: { task: string; technology: string; requirements: string; constraints: string },
  skill: Skill
): number {
  if (segments.task && segments.task.includes('jogo') && skill.domain.toLowerCase().includes('frontend')) {
    return 20;
  }
  return 0;
}

/**
 * Calculate technology matching score
 */
function calculateTechnologyScore(
  segments: { task: string; technology: string; requirements: string; constraints: string },
  skill: Skill
): number {
  if (!skill.techAffinity || !segments.technology) {
    return 0;
  }
  const techMatches = skill.techAffinity.filter(tech =>
    segments.technology.toLowerCase().includes(tech.toLowerCase())
  ).length;
  return techMatches * 8;
}

/**
 * Calculate semantic matching score with purpose
 */
function calculatePurposeScore(
  segments: { task: string; technology: string; requirements: string; constraints: string },
  skill: Skill
): number {
  if (!skill.purpose || !segments.task || !segments.requirements) return 0;
  const purposeScore = calculateTextSimilarity(segments.task + ' ' + segments.requirements, skill.purpose.toLowerCase());
  return purposeScore * 15;
}

/**
 * Calculate semantic matching score with title
 */
function calculateTitleScore(
  segments: { task: string; technology: string; requirements: string; constraints: string },
  skill: Skill
): number {
  if (!segments.task || !skill.title) return 0;
  const titleScore = calculateTextSimilarity(segments.task, skill.title.toLowerCase());
  return titleScore * 10;
}

/**
 * Calculate semantic matching score with keywords
 */
function calculateKeywordScore(
  segments: { task: string; technology: string; requirements: string; constraints: string },
  skill: Skill
): number {
  if (!segments.task && !segments.requirements) return 0;
  if (!skill.keywords) return 0;
  const keywordMatches = skill.keywords.filter(keyword => {
    // Check for partial matches and related terms
    const keywordLower = keyword.toLowerCase();
    return (segments.task && segments.task.includes(keywordLower)) ||
           (segments.requirements && segments.requirements.includes(keywordLower)) ||
           calculateTextSimilarity(segments.task, keywordLower) > 0.3;
  }).length;

  return keywordMatches * 5;
}

/**
 * Calculate boost for frontend skills when HTML/CSS/JS mentioned
 */
function calculateFrontendBoostScore(
  segments: { task: string; technology: string; requirements: string; constraints: string },
  skill: Skill
): number {
  const hasFrontendTech = segments.technology && (
    segments.technology.includes('html') ||
    segments.technology.includes('css') ||
    segments.technology.includes('js')
  );

  const isFrontendSkill = skill.domain && skill.techAffinity && (
    skill.domain.toLowerCase().includes('frontend') ||
    skill.techAffinity.some(tech => ['html', 'css', 'javascript'].includes(tech.toLowerCase()))
  );

  if (hasFrontendTech && isFrontendSkill) {
    return 15;
  }

  return 0;
}

/**
 * Calculate semantic similarity between texts using a combination of methods
 */
function calculateTextSimilarity(text1: string, text2: string): number {
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
export function findActiveSkills(text: string, allSkills: Skill[]): Skill[] {
  // First, find skills using traditional pattern matching
  const foundIds = findSkillIdsInText(text, allSkills);
  const traditionalMatches = getActiveSkillsById(foundIds, allSkills);

  // Then, use semantic analysis to find additional relevant skills
  const semanticMatches = discoverSemanticSkills(text, allSkills);

  // Combine both results, avoiding duplicates
  const allMatchedSkills = new Map<string, Skill>();

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
function discoverSemanticSkills(text: string, allSkills: Skill[]): Skill[] {
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
export function findActiveSkillsAndCompositions(text: string, allSkills: Skill[], compositions: SkillComposition[] = []): { skills: Skill[]; compositions: SkillComposition[] } {
  // Find individual skills using enhanced detection
  const skills = findActiveSkills(text, allSkills);

  // Find compositions
  const activeCompositions = findActiveCompositions(text, compositions);

  return { skills, compositions: activeCompositions };
}

/**
 * Find active compositions based on trigger conditions
 */
function findActiveCompositions(text: string, compositions: SkillComposition[]): SkillComposition[] {
  const lowerText = text.toLowerCase();
  return compositions.filter(comp =>
    comp.triggerConditions.some(condition =>
      lowerText.includes(condition.toLowerCase())
    )
  );
}

/**
 * Find skill IDs in text using various patterns
 */
function findSkillIdsInText(text: string, allSkills: Skill[]): Set<string> {
  const foundIds = new Set<string>();
  const skillIds = allSkills.map(s => s.id.toLowerCase());

  // 1. Match Standard Tags: <skill: id> or [[skill: id]]
  const tagRegex = /(?:<|\[\[)skill:\s*([a-z0-9-]+)\s*(?:>|\]\])/gi;
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    foundIds.add(match[1].toLowerCase());
  }

  // 2. Match Bold Declarations: **Skill: id1, id2**
  const boldRegex = /\*\*(?:Skills?|Mindsets?):\s*([^*]+)\*\*/gi;
  while ((match = boldRegex.exec(text)) !== null) {
    const ids = match[1].split(/[,/|\s]+/).map(id => id.trim().toLowerCase());
    ids.forEach(id => {
      // Clean possible tag remnants from the capture
      const cleanId = id.replace(/<skill:\s*|>|\[\[|\]\]/gi, '').trim();
      if (skillIds.includes(cleanId)) foundIds.add(cleanId);
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

    if (skillIds.includes(slugified)) foundIds.add(slugified);
    else if (skillIds.includes(cleanId)) foundIds.add(cleanId);
  });

  return foundIds;
}

/**
 * Get active skills by found IDs
 */
function getActiveSkillsById(foundIds: Set<string>, allSkills: Skill[]): Skill[] {
  const activeSkills: Skill[] = [];

  for (const skill of allSkills) {
    if (foundIds.has(skill.id.toLowerCase())) {
      activeSkills.push(skill);
    }
  }

  return activeSkills;
}