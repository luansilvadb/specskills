const path = require('path');
const fs = require('fs');

// Simple mimic of the new logic
function getRecommendedSkills(description, signals) {
  const normalizedDesc = description.toLowerCase();
  const recs = [];

  Object.entries(signals).forEach(([id, triggers]) => {
    let score = 0;
    
    // 1. Keyword matches
    const matches = triggers.filter(t => normalizedDesc.includes(t.toLowerCase())).length;
    score += matches * 2;

    // 2. Technical heuristic (the one I just added to src/utils/skills.ts)
    if (id === 'ui-ux-code-generation' && 
       (normalizedDesc.includes('html') || normalizedDesc.includes('css') || normalizedDesc.includes('javascript') || normalizedDesc.includes('js'))) {
      score += 2;
    }

    if (id === 'req-fault-tolerance' && 
       (normalizedDesc.includes('resiliência') || normalizedDesc.includes('falha') || normalizedDesc.includes('edge case'))) {
      score += 2;
    }

    if (score > 0) recs.push({ id, score });
  });

  return recs.sort((a,b) => b.score - a.score);
}

function parseSkillCatalog(content) {
  const signals = {};
  if (content.includes('|')) {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('|') && !line.includes('---') && !line.includes('Skill Name')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 5) {
          let id = parts[1].replace(/\*\*/g, '').trim();
          let triggersStr = parts[4];
          if (id && triggersStr) {
            const triggerArray = triggersStr
              .split(',')
              .map(t => t.trim().replace(/^`|`$/g, '').toLowerCase())
              .filter(t => t.length > 0);
            signals[id] = triggerArray;
          }
        }
      }
    }
  }
  return signals;
}

const catalogPath = path.join(process.cwd(), 'conductor', 'skills', 'catalog.md');
const content = fs.readFileSync(catalogPath, 'utf8');
const signals = parseSkillCatalog(content);

const query = 'quero criar um pdv em html css e javascript';
const product = fs.readFileSync(path.join(process.cwd(), 'conductor', 'product.md'), 'utf8');
const tech = fs.readFileSync(path.join(process.cwd(), 'conductor', 'tech-stack.md'), 'utf8');
const context = `${query}\n${product}\n${tech}`;

const recs = getRecommendedSkills(context, signals);

console.log('--- 💡 Match Test (New Logic) ---');
console.log('Context size:', context.length);
recs.forEach(r => {
    console.log(`✅ [${r.id}] Score: ${r.score}`);
});
