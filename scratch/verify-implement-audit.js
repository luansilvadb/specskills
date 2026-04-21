const path = require('path');
const fs = require('fs');

const conductorDir = path.join(process.cwd(), 'conductor');
const trackPath = path.join(conductorDir, 'tracks', 'pos-system');
const planPath = path.join(trackPath, 'plan.md');

console.log('--- 🛡️ Implement Command Audit Verification ---');

// 1. Simulating skill find logic
const planContent = fs.readFileSync(planPath, 'utf8');
const skillRegex = /<skill:\s*([a-z0-9-]+)\s*>/gi;
let match;
const foundIds = [];
while ((match = skillRegex.exec(planContent)) !== null) {
    foundIds.push(match[1].toLowerCase());
}
console.log('Active Skills found in plan.md:', foundIds.join(', '));

// 2. Simulating Project Context highlights
const productContent = fs.readFileSync(path.join(conductorDir, 'product.md'), 'utf8');
const techStackContent = fs.readFileSync(path.join(conductorDir, 'tech-stack.md'), 'utf8');

const goalMatch = productContent.match(/## Project Goal\n\n([\s\S]+?)(?:\n##|$)/);
const techMatch = techStackContent.match(/- Primary: (.+)/);

console.log('\n--- 💡 Context Highlights ---');
if (goalMatch) console.log('✅ Goal Highlight found:', goalMatch[1].trim().split('\n')[0]);
else console.log('❌ Goal Highlight NOT found (Check pattern)');

if (techMatch) console.log('✅ Tech Highlight found:', techMatch[1].trim());
else console.log('❌ Tech Highlight NOT found (Check pattern)');

// 3. Verifying deduplication in the code
const implementCode = fs.readFileSync(path.join(process.cwd(), 'src', 'commands', 'implement.ts'), 'utf8');
const occurrences = (implementCode.match(/message \+= contextInfo/g) || []).length;
console.log('\n--- 🧹 Code Deduplication ---');
console.log(`Occurrences of 'message += contextInfo': ${occurrences}`);
if (occurrences === 1) console.log('✅ Success: Code is deduplicated!');
else console.log(`❌ Failure: Found ${occurrences} occurrences.`);

// 4. Checking skill protocol injection
const skillLoopMatch = implementCode.includes('skill.protocol') && implementCode.includes('skill.purpose');
console.log('\n--- 🧠 Skill Context Optimization ---');
if (skillLoopMatch) console.log('✅ Success: Using protocol/purpose instead of full content!');
else console.log('❌ Failure: Still using full content or missing logic.');
