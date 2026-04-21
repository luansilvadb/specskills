import { findActiveSkills } from '../src/utils/skills';
import { Skill } from '../src/types';

const mockSkills: Skill[] = [
  {
    id: 'ui-ux-code-generation',
    title: 'UI/UX Code Generation',
    trigger: '<skill: ui-ux-code-generation>',
    content: '## Protocol\nAlways use consistent colors.',
    protocol: 'Always use consistent colors.',
    keywords: [],
    techAffinity: [],
    domain: '',
    directives: ''
  },
  {
    id: 'edge-case-mapper',
    title: 'Edge Case Mapper',
    trigger: '<skill: edge-case-mapper>',
    content: '## Protocol\nMap exceptions.',
    protocol: 'Map exceptions.',
    keywords: [],
    techAffinity: [],
    domain: '',
    directives: ''
  }
];

const planContent = `
# Plan
## Architecture Mindsets

### ui ux code generation
Aplicar princípios de resiliência.

### Mindset: edge-case-mapper
Mapear exceções.
`;

const active = findActiveSkills(planContent, mockSkills);

console.log('Active Skills Found:', active.map(s => s.id));

if (active.length === 2) {
  console.log('SUCCESS: Headers detected.');
} else {
  console.log('FAILURE: Headers NOT detected.');
}
