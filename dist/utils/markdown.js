"use strict";
/**
 * Markdown parsing utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSpecDocument = parseSpecDocument;
exports.parseTracksIndex = parseTracksIndex;
exports.parsePlanTasks = parsePlanTasks;
exports.updateTaskStatus = updateTaskStatus;
exports.updateTrackStatus = updateTrackStatus;
exports.countTasksByStatus = countTasksByStatus;
exports.reconcileCatalog = reconcileCatalog;
exports.renderProgressBar = renderProgressBar;
/**
 * Parse a spec document from markdown content
 */
function parseSpecDocument(content) {
    // Default values
    const spec = {
        id: 'unknown',
        title: 'Unknown Spec',
        description: '',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requirements: [],
        acceptanceCriteria: []
    };
    // Parse title (first heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        spec.title = titleMatch[1];
    }
    // Parse description (first paragraph after title)
    const descMatch = content.match(/^#\s+.+\n\n([^#]+)/m);
    if (descMatch) {
        spec.description = descMatch[1].trim();
    }
    // Parse other metadata from frontmatter or inline
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        // Parse YAML-like metadata
        const lines = frontmatter.split('\n');
        for (const line of lines) {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
                switch (key.toLowerCase()) {
                    case 'id':
                        spec.id = value.replace(/['"]/g, '');
                        break;
                    case 'version':
                        spec.version = value.replace(/['"]/g, '');
                        break;
                    case 'status':
                        const statusValue = value.replace(/['"]/g, '').toLowerCase();
                        if (['draft', 'review', 'approved', 'deprecated'].includes(statusValue)) {
                            spec.status = statusValue;
                        }
                        break;
                }
            }
        }
    }
    // Parse requirements from lists
    const reqLines = content.split('\n').filter(line => line.trim().match(/^-\s+\*\*Requirement\*\*:|^-\s+REQ-\d+:|^- ID:/i));
    for (const reqLine of reqLines) {
        const reqMatch = reqLine.match(/(-\s+)(.+)$/);
        if (reqMatch) {
            spec.requirements.push({
                id: `req-${spec.requirements.length + 1}`,
                title: reqMatch[2],
                description: reqMatch[2],
                category: 'functional',
                priority: 'medium'
            });
        }
    }
    return spec;
}
/**
 * Parse a tracks index file to extract track information.
 * Supports both legacy list format and high-fidelity separator format.
 */
function parseTracksIndex(content) {
    // Only use separator parser if we find the signature pattern of the new format
    if (content.includes('\n---') && content.includes('**Track:')) {
        return parseTracksWithSeparators(content);
    }
    return parseTracksWithLegacyFormat(content);
}
/**
 * Parse tracks using legacy format
 */
function parseTracksWithLegacyFormat(content) {
    const tracks = [];
    const lines = content.split('\n');
    for (const line of lines) {
        // Match new format: `- [ ] **Track:** description [folder](./tracks/xxx/)`
        // Match legacy format: `## [ ] Track: description`
        const trackMatch = line.match(/(?:-\s*|##\s*)\[(\s|~|x)\]\s*(?:\*\*)?Track:?(?:\*\*)?\s*(.+?)\s*\[(?:.+?)\]\((.+?)\)/i);
        if (trackMatch) {
            const statusChar = trackMatch[1];
            const status = getStatusFromChar(statusChar);
            const description = trackMatch[2].trim();
            const folderPath = trackMatch[3].trim();
            tracks.push({ status, description, folderPath });
            continue;
        }
        // Match table format: `| [id](folder) | description | status | date |`
        const tableMatch = line.match(/\|\s*\[.+?\]\((.+?)\)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/i);
        if (tableMatch) {
            const folderPath = tableMatch[1].trim();
            const description = tableMatch[2].trim();
            const statusText = tableMatch[3].toLowerCase();
            const status = getStatusFromText(statusText);
            tracks.push({ status, description, folderPath });
        }
    }
    return tracks;
}
/**
 * Convert status character to track status
 */
function getStatusFromChar(statusChar) {
    return statusChar === 'x' ? 'completed' :
        statusChar === '~' ? 'in_progress' : 'pending';
}
/**
 * Convert status text to track status
 */
function getStatusFromText(statusText) {
    return statusText.includes('complete') ? 'completed' :
        statusText.includes('progress') ? 'in_progress' : 'pending';
}
/**
 * High-fidelity parser for tracks separated by ---
 */
function parseTracksWithSeparators(content) {
    const tracks = [];
    const sections = content.split(/\n---\s*\n/);
    for (const section of sections) {
        // Skip intro section (usually starts with #)
        if (section.trim().startsWith('#'))
            continue;
        const lines = section.trim().split('\n');
        const headerLine = lines.find(l => l.match(/\[(\s|~|x)\]\s*(?:\*\*)?Track:?(?:\*\*)?\s*(.+?)$/i));
        const linkLine = lines.find(l => l.match(/Link:\s*\[.+?\]\((.+?)\)/i));
        if (headerLine) {
            const match = headerLine.match(/\[(\s|~|x)\]\s*(?:\*\*)?Track:?(?:\*\*)?\s*(.+?)$/i);
            if (match) {
                const statusChar = match[1];
                const status = statusChar === 'x' ? 'completed' :
                    statusChar === '~' ? 'in_progress' : 'pending';
                const description = match[2].replace(/\*\*$/, '').trim();
                let folderPath = '';
                if (linkLine) {
                    const lMatch = linkLine.match(/Link:\s*\[.+?\]\((.+?)\)/i);
                    if (lMatch)
                        folderPath = lMatch[1].trim();
                }
                // Extract any other metadata lines (*Key: Value*)
                const metadata = {};
                lines.forEach(l => {
                    const mMatch = l.match(/^\*(.+?):\s*(.+?)\*$/);
                    if (mMatch) {
                        metadata[mMatch[1].trim()] = mMatch[2].trim();
                    }
                });
                tracks.push({ status, description, folderPath, metadata });
            }
        }
    }
    return tracks;
}
/**
 * Parse a plan file to extract tasks
 */
function parsePlanTasks(content) {
    const tasks = [];
    const lines = content.split('\n');
    for (const line of lines) {
        // Match task lines: `- [ ] task description` or `- [x] task description [commit: abc1234]`
        const taskMatch = line.match(/-\s*\[(\s|~|x)\]\s*(.+?)(?:\s*\[commit:\s*([a-f0-9]+)\])?$/i);
        if (taskMatch) {
            const statusChar = taskMatch[1];
            const status = getStatusFromChar(statusChar);
            const description = taskMatch[2].trim();
            const commitHash = taskMatch[3];
            tasks.push({ status, description, commitHash });
        }
    }
    return tasks;
}
/**
 * Update task status in markdown content
 */
function updateTaskStatus(content, taskDescription, newStatus, commitHash) {
    const statusChar = newStatus === 'completed' ? 'x' :
        newStatus === 'in_progress' ? '~' : ' ';
    const escapedDescription = taskDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(-\\s*\\[)(?:\\s|~|x)(\\]\\s*${escapedDescription})(?:\\s*\\[commit:\\s*[a-f0-9]+\\])?$`, 'i');
    const commitPart = commitHash ? ` [commit: ${commitHash}]` : '';
    return content.replace(pattern, `$1${statusChar}$2${commitPart}`);
}
/**
 * Update track status in markdown content
 */
function updateTrackStatus(content, trackDescription, newStatus) {
    const statusChar = newStatus === 'completed' ? 'x' :
        newStatus === 'in_progress' ? '~' : ' ';
    const escapedDescription = trackDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match new format: `- [ ] **Track:** description` or `- [ ] **Track: description**`
    const pattern1 = new RegExp(`(-\\s*\\[)(?:\\s|~|x)(\\]\\s*\\*\\*Track:?:?\\*\\*\\s*${escapedDescription})`, 'i');
    // Match legacy format: `## [ ] Track: description`
    const pattern2 = new RegExp(`(#+\\s*\\[)(?:\\s|~|x)(\\]\\s*Track:?\\s*${escapedDescription})`, 'i');
    return content
        .replace(pattern1, `$1${statusChar}$2`)
        .replace(pattern2, `$1${statusChar}$2`);
}
/**
 * Count tasks by status
 */
function countTasksByStatus(tasks) {
    return {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
    };
} /**
 * Reconcile catalog content with a list of skills
 */
function reconcileCatalog(content, skills) {
    let updatedContent = content.trim();
    if (!updatedContent.includes('# Conductor Skills Catalog')) {
        updatedContent = '# Conductor Skills Catalog\n\nEste catálogo define as habilidades (skills) disponíveis e os sinais de detecção usados para recomendar automaticamente essas habilidades durante o planejamento de uma trilha.\n';
    }
    for (const skill of skills) {
        const escapedId = skill.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const skillPattern = new RegExp(`### ${escapedId}\\n([\\s\\S]*?)(?=\\n###|$)`, 'i');
        const signals = skill.keywords && skill.keywords.length > 0
            ? `\`${skill.keywords.join('`, `')}\``
            : 'None';
        const newSection = `### ${skill.id}\n- **Description**: ${skill.purpose || skill.title || 'No description available.'}\n- **Signals**: ${signals}\n- **Always Recommend**: false\n`;
        if (updatedContent.match(skillPattern)) {
            // Update existing section
            updatedContent = updatedContent.replace(skillPattern, newSection);
        }
        else {
            // Append new section
            if (!updatedContent.endsWith('\n'))
                updatedContent += '\n';
            updatedContent += `\n${newSection}`;
        }
    }
    return updatedContent;
}
/**
 * Render a text-based progress bar
 */
function renderProgressBar(percent, width = 20) {
    const completedCount = Math.round((percent / 100) * width);
    const remainingCount = width - completedCount;
    return `[${'█'.repeat(completedCount)}${'░'.repeat(remainingCount)}] ${percent}%`;
}
