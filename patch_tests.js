const fs = require('fs');
const path = 'apps/api/src/routes/__tests__/papers.test.ts';
let content = fs.readFileSync(path, 'utf8');

const testNames = [
  'POST /api/papers/:id/track accepts view event',
  'POST /api/papers/:id/track requires a tracking hash secret',
  'POST /api/papers/:id/track ignores bots',
  'POST /api/papers/:id/track logs sanitized error on failure (Error instance)',
  'POST /api/papers/:id/track logs sanitized error on failure (string error)',
  'POST /api/papers/:id/track handles duplicate dedup rows',
  'POST /api/papers/:id/track returns 404 when paper does not exist',
  'POST /api/papers/:id/track handles missing json payload',
  'POST /api/papers/:id/track handles non-object JSON body',
  'POST /api/papers/:id/track captures parsing errors in promise'
];

for (const testName of testNames) {
  const index = content.indexOf(`it("${testName}", async () => {`);
  if (index === -1) {
    console.error(`Could not find test: ${testName}`);
    continue;
  }

  // Find the body of the test
  const bodyStart = index + `it("${testName}", async () => {\n`.length;

  // Inject token creation
  const injectTokenStr = `    const token = await createTestJWT({ sub: "user-1" });\n`;
  content = content.slice(0, bodyStart) + injectTokenStr + content.slice(bodyStart);

  // Find the app.request call within this test
  // It looks like:
  // const res = await app.request(
  //   "http://localhost/api/papers/paper-1/track",
  //   {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Origin: "http://localhost:3000",
  //       "User-Agent": "Vitest",
  //     },

  const nextAppRequest = content.indexOf('"http://localhost/api/papers/', index);
  if (nextAppRequest !== -1) {
    const headersIndex = content.indexOf('headers: {', nextAppRequest);
    if (headersIndex !== -1) {
      const insertPoint = headersIndex + 'headers: {\n'.length;
      content = content.slice(0, insertPoint) + `          Authorization: \`Bearer \${token}\`,\n` + content.slice(insertPoint);
    }
  }
}

fs.writeFileSync(path, content, 'utf8');
console.log("Tests patched successfully");
