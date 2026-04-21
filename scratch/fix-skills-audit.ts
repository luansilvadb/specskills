import * as path from 'path';
import { loadAllSkills, getRecommendedSkills } from './src/utils/skills';
import { readFile } from './src/utils/fileSystem';

const conductorDir = path.join(process.cwd(), 'conductor');
const skillsDir = path.join(conductorDir, 'skills');

console.log('--- 🛡️ Skill System Audit ---');

// 1. Test loading with table parser
const allSkills = loadAllSkills(skillsDir);
console.log(`Total skills found: ${allSkills.length}`);

if (allSkills.length === 0) {
    console.error('❌ No skills found! Parser might be completely broken.');
    process.exit(1);
}

// 2. Report triggers found for each skill
allSkills.forEach(s => {
    const triggerCount = s.keywords.length;
    console.log(`- [${s.id}] Triggers found: ${triggerCount}`);
    if (triggerCount === 0) {
        console.warn(`  ⚠️ Warning: No triggers for ${s.id}`);
    }
});

// 3. Test recommendation with context
const query = 'quero criar um pdv em html css e javascript';
const product = readFile(path.join(conductorDir, 'product.md')) || '';
const tech = readFile(path.join(conductorDir, 'tech-stack.md')) || '';
const context = `${query}\n${product}\n${tech}`;

const recs = getRecommendedSkills(context, allSkills);
console.log('\n--- 💡 Recommendation Test ---');
console.log('Query description:', query);
console.log('Recommended skills:', recs.map(s => s.id).join(', '));

const hasUI = recs.some(r => r.id === 'ui-ux-code-generation');
const hasResilience = recs.some(r => r.id === 'req-fault-tolerance');

if (hasUI) console.log('✅ Found UI/UX skill via context!');
else console.log('❌ Failed to find UI/UX skill.');

if (hasResilience) console.log('✅ Found Resilience skill via context!');
else console.log('❌ Failed to find Resilience skill.');
