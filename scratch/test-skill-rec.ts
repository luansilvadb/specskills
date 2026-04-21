import * as path from 'path';
import { loadAllSkills, getRecommendedSkills } from './src/utils/skills';

const conductorDir = path.join(process.cwd(), 'conductor');
const allSkills = loadAllSkills(path.join(conductorDir, 'skills'));
const query = 'quero criar um pdv em html css e javascript';
const recs = getRecommendedSkills(query, allSkills);

console.log('Query:', query);
console.log('Recommended Skills:', recs.map(s => s.id));
