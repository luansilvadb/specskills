import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerSkillCommand } from '../registerSkill';
import * as fileSystem from '../../utils/fileSystem';
import * as markdown from '../../utils/markdown';
import * as skills from '../../utils/skills';

vi.mock('../../utils/fileSystem');
vi.mock('../../utils/markdown');
vi.mock('../../utils/skills');

describe('registerSkillCommand', () => {
  const mockContext = {
    projectRoot: '/mock/project',
    conductorDir: '/mock/project/conductor',
    args: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (fileSystem.resolveConductorDir as any).mockReturnValue('/mock/project/conductor');
  });

  it('should create a new catalog if it does not exist (Self-Healing)', async () => {
    (skills.loadAllSkills as any).mockReturnValue([
      { id: 'test-skill', title: 'Test Skill', keywords: ['test'] }
    ]);
    (fileSystem.fileExists as any).mockReturnValue(false);
    (markdown.reconcileCatalog as any).mockReturnValue('# New Catalog Content');

    const result = await registerSkillCommand.execute(mockContext, []);

    expect(fileSystem.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('catalog.md'),
      '# New Catalog Content'
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain('created successfully');
  });

  it('should update an existing catalog', async () => {
    (skills.loadAllSkills as any).mockReturnValue([
      { id: 'existing-skill', title: 'Existing Skill', keywords: ['updated'] }
    ]);
    (fileSystem.fileExists as any).mockReturnValue(true);
    (fileSystem.readFile as any).mockReturnValue('# Existing Catalog');
    (markdown.reconcileCatalog as any).mockReturnValue('# Updated Catalog Content');

    const result = await registerSkillCommand.execute(mockContext, []);

    expect(fileSystem.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('catalog.md'),
      '# Updated Catalog Content'
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain('updated successfully');
  });

  it('should fail if no skills are found', async () => {
    (skills.loadAllSkills as any).mockReturnValue([]);

    const result = await registerSkillCommand.execute(mockContext, []);

    expect(result.success).toBe(false);
    expect(result.message).toContain('No skills found');
  });
});
