import * as path from 'path';
import { loadAllSkills, getRecommendedSkills } from '../src/utils/skills';

const projectRoot = 'd:/specskills';
const conductorDir = path.join(projectRoot, 'conductor');
const skillsDir = path.join(conductorDir, 'skills');

console.log(`Loading skills from: ${skillsDir}`);
const allSkills = loadAllSkills(skillsDir);
console.log(`Loaded ${allSkills.length} skills.`);

const testPrompts = [
  "criar um sistema pdv para windows utilizando flutter, sqlite",
  "create a secure web app with nextjs and postgres",
  "audit a smart contract for reentrancy bugs"
];

for (const prompt of testPrompts) {
  console.log(`\nTesting Prompt: "${prompt}"`);
  const recommended = getRecommendedSkills(prompt, allSkills);
  if (recommended.length === 0) {
    console.log("No skills recommended.");
  } else {
    recommended.forEach(r => {
      console.log(`- [${r.score}] ${r.skill.title} (${r.skill.id})`);
    });
  }
}
