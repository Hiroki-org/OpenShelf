const fs = require('fs');
const content = fs.readFileSync('apps/web/src/app/settings/page.tsx', 'utf-8');
console.log(content);
