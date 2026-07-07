const fs = require('fs');
const content = fs.readFileSync('apps/web/src/app/settings/page.tsx', 'utf-8');
const chunkSize = 2000;
for (let i = 0; i < content.length; i += chunkSize) {
    console.log(`--- CHUNK ${i / chunkSize + 1} ---`);
    console.log(content.slice(i, i + chunkSize));
}
