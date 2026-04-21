import { describe, it, expect } from 'vitest';
import {
  parseTracksIndex,
  parsePlanTasks,
  updateTaskStatus,
  updateTrackStatus,
  countTasksByStatus
} from './markdown';

describe('Markdown Utils', () => {
  describe('parseTracksIndex', () => {
    it('should parse active tracks from registry', () => {
      // Note: The current parser uses regex that might need tweaking for the table format
      // but let's test the current regex logic first.
      // Current regex: /(?:-\s*|##\s*)\[(\s|~|x)\]\s*(?:\*\*)?Track:?(?:\*\*)?\s*(.+?)\s*\[(?:.+?)\]\((.+?)\)/i
      
      // Let's test the format the parser actually expects based on the regex
      const legacyContent = `## [~] Track: Test Track [folder](./tracks/test-track/)`;
      const tracks = parseTracksIndex(legacyContent);
      
      expect(tracks).toHaveLength(1);
      expect(tracks[0]).toEqual({
        status: 'in_progress',
        description: 'Test Track',
        folderPath: './tracks/test-track/'
      });
    });

    it('should parse tracks from table format', () => {
      const content = `| [test-track](./tracks/test-track/) | Test Track | Complete | 2026-04-20 |`;
      const tracks = parseTracksIndex(content);
      
      expect(tracks).toHaveLength(1);
      expect(tracks[0]).toEqual({
        status: 'completed',
        description: 'Test Track',
        folderPath: './tracks/test-track/'
      });
    });

    it('should handle emoji statuses correctly', () => {
      const content = `| [active](./tracks/active/) | Active Track | In Progress | 2026-04-20 |`;
      const tracks = parseTracksIndex(content);
      
      expect(tracks).toHaveLength(1);
      expect(tracks[0].status).toBe('in_progress');
    });
  });

  describe('parsePlanTasks', () => {
    it('should parse tasks with different statuses', () => {
      const content = `
- [ ] Pending task
- [~] In progress task
- [x] Completed task [commit: abc1234]
`;
      const tasks = parsePlanTasks(content);
      
      expect(tasks).toHaveLength(3);
      expect(tasks[0]).toEqual({ status: 'pending', description: 'Pending task', commitHash: undefined });
      expect(tasks[1]).toEqual({ status: 'in_progress', description: 'In progress task', commitHash: undefined });
      expect(tasks[2]).toEqual({ status: 'completed', description: 'Completed task', commitHash: 'abc1234' });
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status and add commit hash', () => {
      const content = `- [~] My task`;
      const updated = updateTaskStatus(content, 'My task', 'completed', 'def5678');
      
      expect(updated).toBe('- [x] My task [commit: def5678]');
    });

    it('should handle special characters in description', () => {
      const content = `- [ ] Task with (parens) and [brackets]`;
      const updated = updateTaskStatus(content, 'Task with (parens) and [brackets]', 'in_progress');
      
      expect(updated).toBe('- [~] Task with (parens) and [brackets]');
    });
  });

  describe('updateTrackStatus', () => {
    it('should update track status in legacy format', () => {
      const content = `## [ ] Track: My Track [folder](./path)`;
      const updated = updateTrackStatus(content, 'My Track', 'in_progress');
      
      expect(updated).toContain('## [~] Track: My Track');
    });
  });

  describe('countTasksByStatus', () => {
    it('should count correctly', () => {
      const tasks: any[] = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'in_progress' },
        { status: 'pending' },
      ];
      const counts = countTasksByStatus(tasks);
      expect(counts).toEqual({
        total: 4,
        completed: 2,
        inProgress: 1,
        pending: 1
      });
    });
  });
});
