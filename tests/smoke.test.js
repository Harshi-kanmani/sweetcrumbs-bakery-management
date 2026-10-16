const test = require('node:test');
const assert = require('node:assert/strict');
const pkg = require('../package.json');
test('project has run scripts and required server dependencies', () => {
  assert.equal(pkg.name, 'sweetcrumbs-bakery-shop');
  assert.ok(pkg.scripts.start);
  assert.ok(pkg.dependencies.express);
  assert.ok(pkg.dependencies['better-sqlite3']);
});
