const fs = require('fs');
const content = fs.readFileSync('lib/request/problemChecklists.ts', 'utf8');

// Match sections in SERVICE_PROBLEM_OPTIONS
const serviceKeys = [...content.matchAll(/"([^"]+)":\s*\[/g)].map(m => m[1]);
console.log('Services with problem options:', serviceKeys);

