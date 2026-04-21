import * as path from 'path';
import { loadAllSkills, getRecommendedSkills } from '../src/utils/skills';

async function test() {
  const skillsDir = path.join(process.cwd(), 'conductor', 'skills');
  console.log('--- Loading real skills ---');
  const allSkills = loadAllSkills(skillsDir);
  console.log('Total skills found:', allSkills.length);
  
  allSkills.forEach(s => {
    console.log(`- [${s.id}] Title: ${s.title}, Triggers: ${s.keywords.join(', ')}`);
  });

  console.log('\n--- Testing Recommendation ---');
  const query = 'Preciso modelar contrato de API e criar componente UI';
  const recs = getRecommendedSkills(query, allSkills);
  
  console.log('Description:', query);
  console.log('Recommended:', recs.map(r => r.title).join(', '));
}

test();
