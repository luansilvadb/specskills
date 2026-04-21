import { describe, it, expect, vi, beforeEach } from 'vitest';
import { implementCommand } from './implement';
import * as fileSystem from '../utils/fileSystem';
import * as markdown from '../utils/markdown';
import * as skills from '../utils/skills';

vi.mock('../utils/fileSystem');
vi.mock('../utils/markdown');
vi.mock('../utils/skills');

describe('Implement Command', () => {
  const mockContext: any = {
    projectRoot: '/root',
    args: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(skills.loadAllSkills).mockReturnValue([]);
    vi.mocked(skills.findActiveSkills).mockReturnValue([]);
  });

  it('should return error if conductor is not set up', async () => {
    vi.mocked(fileSystem.resolveConductorDir).mockReturnValue('/root/conductor');
    vi.mocked(fileSystem.fileExists).mockReturnValue(false); // missing product.md etc
    
    const result = await implementCommand.execute(mockContext, []);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Conductor is not set up');
  });

  it('should list pending tasks when a track is found', async () => {
    vi.mocked(fileSystem.resolveConductorDir).mockReturnValue('/root/conductor');
    vi.mocked(fileSystem.fileExists).mockImplementation((path) => {
      if (path.includes('index.md')) return true;
      if (path.includes('product.md')) return true;
      if (path.includes('tech-stack.md')) return true;
      if (path.includes('workflow.md')) return true;
      if (path.includes('plan.md')) return true;
      if (path.includes('project')) return false; // This was failing the test
      return false;
    });
    vi.mocked(fileSystem.readFile).mockImplementation((path) => {
      if (path.includes('index.md')) return '## [~] Track: My Track [folder](./tracks/test)';
      if (path.includes('plan.md')) return '- [~] Current task\n- [ ] Next task';
      return '';
    });

    vi.mocked(markdown.parseTracksIndex).mockReturnValue([
      { status: 'in_progress', description: 'My Track', folderPath: './tracks/test' }
    ]);
    vi.mocked(markdown.parsePlanTasks).mockReturnValue([
      { status: 'in_progress', description: 'Current task' },
      { status: 'pending', description: 'Next task' }
    ]);

    const result = await implementCommand.execute(mockContext, []);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('My Track');
    expect(result.message).toContain('Current Task');
    expect(result.message).toContain('Next task');
  });

  it('should return error if misplaced project directory is found', async () => {
    vi.mocked(fileSystem.resolveConductorDir).mockReturnValue('/root/conductor');
    vi.mocked(fileSystem.fileExists).mockImplementation((path) => {
      if (path.includes('index.md')) return true;
      if (path.includes('product.md')) return true;
      if (path.includes('tech-stack.md')) return true;
      if (path.includes('workflow.md')) return true;
      if (path.includes('project')) return true; // Simulate misplaced dir
      return false;
    });
    vi.mocked(fileSystem.readFile).mockReturnValue('## [~] Track: My Track [folder](test)');
    vi.mocked(markdown.parseTracksIndex).mockReturnValue([
      { status: 'in_progress', description: 'T', folderPath: 'test' }
    ]);

    const result = await implementCommand.execute(mockContext, []);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Estrutura incorreta detectada');
  });

  it('should return success and message when all tracks are completed', async () => {
    vi.mocked(fileSystem.resolveConductorDir).mockReturnValue('/root/conductor');
    vi.mocked(fileSystem.fileExists).mockReturnValue(true);
    vi.mocked(fileSystem.readFile).mockReturnValue('registry');
    vi.mocked(markdown.parseTracksIndex).mockReturnValue([
      { status: 'completed', description: 'T1', folderPath: 'p1' }
    ]);

    const result = await implementCommand.execute(mockContext, []);
    expect(result.success).toBe(true);
    expect(result.message).toContain('All tracks are completed');
  });

  it('should find track by description matching', async () => {
    vi.mocked(fileSystem.resolveConductorDir).mockReturnValue('/root/conductor');
    vi.mocked(fileSystem.fileExists).mockImplementation((p) => !p.includes('project'));
    vi.mocked(fileSystem.readFile).mockImplementation((p) => {
      if (p.includes('index.md')) return 'registry';
      if (p.includes('plan.md')) return 'plan';
      if (p.includes('spec.md')) return 'spec';
      return 'content';
    });
    vi.mocked(markdown.parseTracksIndex).mockReturnValue([
      { status: 'pending', description: 'Feature ABC', folderPath: 'abc' },
      { status: 'pending', description: 'Bug XYZ', folderPath: 'xyz' }
    ]);
    vi.mocked(markdown.parsePlanTasks).mockReturnValue([]);

    const contextWithArgs = { ...mockContext, args: ['ABC'] };
    const result = await implementCommand.execute(contextWithArgs, ['ABC']);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('Feature ABC');
  });

  it('should return error if multiple tracks match', async () => {
    vi.mocked(fileSystem.resolveConductorDir).mockReturnValue('/root/conductor');
    vi.mocked(fileSystem.fileExists).mockReturnValue(true);
    vi.mocked(fileSystem.readFile).mockReturnValue('registry');
    vi.mocked(markdown.parseTracksIndex).mockReturnValue([
      { status: 'pending', description: 'Task 1', folderPath: '1' },
      { status: 'pending', description: 'Task 1.1', folderPath: '1.1' }
    ]);
    const contextWithArgs = { ...mockContext, args: ['Task'] };
    const result = await implementCommand.execute(contextWithArgs, ['Task']);
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('Multiple tracks match');
  });
});
