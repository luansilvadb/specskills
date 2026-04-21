import { describe, it, expect } from 'vitest';
import { parseSkillFile, findActiveSkills, getRecommendedSkills } from './skills';

describe('Skills Utils', () => {
  describe('parseSkillFile', () => {
    it('should extract title and keywords from YAML frontmatter', () => {
      const content = `---
name: api-contract
triggers:
  - "modelar contrato"
  - "api spec"
---
# API Contract Modeling
## Core Directives
1. Be strict
`;
      const skill = parseSkillFile('api-contract', content);
      
      expect(skill).not.toBeNull();
      expect(skill?.title).toBe('api-contract');
      expect(skill?.keywords).toContain('modelar contrato');
    });

    it('should extract purpose and protocol', () => {
      const content = `---
name: security-skill
---
Propósito: Garantir que nenhum dado sensível vaze.

## Protocolo de Execução
1. Scan for secrets
2. Check PII
`;
      const skill = parseSkillFile('security', content);
      expect(skill?.purpose).toBe('Garantir que nenhum dado sensível vaze.');
      expect(skill?.protocol).toContain('Scan for secrets');
    });

    it('should extract purpose from blockquote', () => {
      const content = `# Skill
> "O erro é um dado."
`;
      const skill = parseSkillFile('id', content);
      expect(skill?.purpose).toBe('O erro é um dado.');
    });

    it('should fallback to standard parsing if YAML is missing', () => {
      const content = `# Skill: UI Architect
**Trigger:** <skill: ui-architect>
**Keywords:** ui, layout
`;
      const skill = parseSkillFile('ui-architect', content);
      expect(skill?.title).toBe('UI Architect');
      expect(skill?.keywords).toContain('ui');
    });
  });

  describe('getRecommendedSkills', () => {
    const allSkills: any[] = [
      { id: 'ui', keywords: ['ui', 'layout', 'css'] },
      { id: 'db', keywords: ['sql', 'database', 'prisma'] }
    ];

    it('should recommend skill if description contains keyword', () => {
      const rec = getRecommendedSkills('Create a new UI layout', allSkills);
      expect(rec).toHaveLength(1);
      expect(rec[0].id).toBe('ui');
    });

    it('should recommend multiple skills if they match', () => {
      const rec = getRecommendedSkills('Setup database and UI', allSkills);
      expect(rec).toHaveLength(2);
    });
  });

  describe('findActiveSkills', () => {
    const allSkills: any[] = [
      { id: 'ui-architect', title: 'UI Architect' },
      { id: 'backend', title: 'Backend' }
    ];

    it('should find multiple triggers in text', () => {
      const text = 'Build <skill: ui-architect> and <skill: backend>';
      const active = findActiveSkills(text, allSkills);
      
      expect(active).toHaveLength(2);
      expect(active.map(s => s.id)).toContain('ui-architect');
      expect(active.map(s => s.id)).toContain('backend');
    });

    it('should ignore non-existent skill IDs', () => {
      const text = 'Use <skill: ghost>';
      const active = findActiveSkills(text, allSkills);
      expect(active).toHaveLength(0);
    });

    it('should handle case-insensitive triggers', () => {
      const text = 'Use <SKILL: UI-ARCHITECT>';
      const active = findActiveSkills(text, allSkills);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('ui-architect');
    });
  });
});
