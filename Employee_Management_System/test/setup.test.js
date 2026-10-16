const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { verifyPassword } = require('../lib/passwords');
const root = path.resolve(__dirname, '..');
function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ems-setup-'));
  t.after(() => {
    if (path.dirname(path.resolve(directory)) !== path.resolve(os.tmpdir()) || !path.basename(directory).startsWith('ems-setup-')) throw new Error('Unexpected cleanup path.');
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}
function run(script, directory, env = {}, args = []) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { cwd: root, env: { ...process.env, EMS_DATA_DIR: directory, NODE_ENV: 'test', ...env }, encoding: 'utf8', timeout: 15000, windowsHide: true });
}
function read(directory, file, key) { return JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'))[key]; }

test('first-admin CLI requires valid configuration, stores a hash, and refuses replacement', (t) => {
  const directory = temporary(t);
  assert.equal(run('create-admin.js', directory, { EMS_ADMIN_NAME: '', EMS_ADMIN_EMAIL: '', EMS_ADMIN_DOB: '', EMS_ADMIN_PASSWORD: '' }).status, 1);
  assert.deepEqual(fs.readdirSync(directory), []);
  const env = { EMS_ADMIN_NAME: 'Local Administrator', EMS_ADMIN_EMAIL: 'local@test.example', EMS_ADMIN_DOB: '1990-01-01', EMS_ADMIN_PASSWORD: 'PrivateAdmin2026!' };
  const created = run('create-admin.js', directory, env);
  assert.equal(created.status, 0, created.stderr);
  const admins = read(directory, 'admin_db.json', 'admins');
  assert.equal(admins.length, 1);
  assert.ok(!('password' in admins[0]));
  assert.ok(verifyPassword(env.EMS_ADMIN_PASSWORD, admins[0]));
  const original = fs.readFileSync(path.join(directory, 'admin_db.json'), 'utf8');
  assert.equal(run('create-admin.js', directory, { ...env, EMS_ADMIN_EMAIL: 'replacement@test.example' }).status, 1);
  assert.equal(fs.readFileSync(path.join(directory, 'admin_db.json'), 'utf8'), original);
});

test('demo seeding is explicit, hashed, non-destructive, and disabled in production', (t) => {
  const directory = temporary(t);
  assert.equal(run('seed-demo.js', directory, { NODE_ENV: 'production' }).status, 1);
  assert.deepEqual(fs.readdirSync(directory), []);
  const seeded = run('seed-demo.js', directory);
  assert.equal(seeded.status, 0, seeded.stderr);
  const admins = read(directory, 'admin_db.json', 'admins');
  const employees = read(directory, 'emp_db.json', 'employees');
  assert.equal(admins.length, 1);
  assert.equal(employees.length, 20);
  for (const account of [...admins, ...employees]) assert.ok(!('password' in account));
  assert.ok(verifyPassword('DemoAdmin2026!', admins[0]));
  assert.ok(verifyPassword('DemoEmployee2026!', employees[0]));
  const original = fs.readFileSync(path.join(directory, 'emp_db.json'), 'utf8');
  assert.equal(run('seed-demo.js', directory).status, 1);
  assert.equal(fs.readFileSync(path.join(directory, 'emp_db.json'), 'utf8'), original);
});

test('legacy migration validates both files, preserves source, and rekeys/hashes accounts', (t) => {
  const source = temporary(t);
  const destination = temporary(t);
  const admin = { id: 1, name: 'Legacy Administrator', email: 'legacy@test.example', password: 'OldPassword2026!', dob: '1990-01-01' };
  const sourceAdmin = JSON.stringify({ admins: [admin] });
  fs.writeFileSync(path.join(source, 'admin_db.json'), sourceAdmin);
  fs.writeFileSync(path.join(source, 'emp_db.json'), '{"employees":');
  assert.equal(run('migrate-legacy.js', destination, {}, [source]).status, 1);
  assert.deepEqual(fs.readdirSync(destination), []);
  fs.writeFileSync(path.join(source, 'emp_db.json'), '{"employees":[]}');
  const migrated = run('migrate-legacy.js', destination, {}, [source]);
  assert.equal(migrated.status, 0, migrated.stderr);
  const stored = read(destination, 'admin_db.json', 'admins')[0];
  assert.notEqual(stored.id, admin.id);
  assert.ok(!('password' in stored));
  assert.ok(verifyPassword(admin.password, stored));
  assert.equal(fs.readFileSync(path.join(source, 'admin_db.json'), 'utf8'), sourceAdmin);
  const original = fs.readFileSync(path.join(destination, 'admin_db.json'), 'utf8');
  assert.equal(run('migrate-legacy.js', destination, {}, [source]).status, 1);
  assert.equal(fs.readFileSync(path.join(destination, 'admin_db.json'), 'utf8'), original);
});
