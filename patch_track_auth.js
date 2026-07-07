const fs = require('fs');
const path = 'apps/api/src/routes/papers.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /papersRoute\.post\("\/:id\/track", async \(c\) => \{/g,
  'papersRoute.post("/:id/track", authMiddleware, async (c) => {'
);

fs.writeFileSync(path, content, 'utf8');
console.log("File patched successfully");
