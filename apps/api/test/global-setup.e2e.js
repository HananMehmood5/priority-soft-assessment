/**
 * Runs once before all e2e tests. Migrates and seeds the test database so
 * tests have the data they need (e.g. admin@coastaleats.com).
 *
 * sequelize-cli (run in api cwd) loads DATABASE_URL from apps/api/.env via
 * config.js. Set DATABASE_URL in .env or .env.test to your test database.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function run(cmd, args, apiRoot) {
  const r = spawnSync(cmd, args, {
    cwd: apiRoot,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });
  if (r.status !== 0) {
    throw new Error(`e2e global setup failed: ${cmd} ${args.join(' ')} exited with ${r.status}`);
  }
}

module.exports = function globalSetup() {
  const apiRoot = path.resolve(__dirname, '..');
  run('npx', ['sequelize-cli', 'db:migrate', '--env', 'test'], apiRoot);
  run('npx', ['sequelize-cli', 'db:seed:all', '--env', 'test'], apiRoot);
};
