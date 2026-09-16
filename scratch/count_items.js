const fs = require('fs');
const content = fs.readFileSync('lib/request/problemChecklists.ts', 'utf8');
const idMatches = [...content.matchAll(/id:\s*["']([^"']+)["']/g)].map(m => m[1]);
console.log('Total checklist items:', idMatches.length);
console.log('Sample IDs:', idMatches.slice(0, 10));

