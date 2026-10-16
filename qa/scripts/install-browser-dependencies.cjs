'use strict';
// Install the applications imported by the browser specs, then the QA runner.
// Keep Cypress's binary download explicit in CI rather than relying on postinstall.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const directories = [
  'Employee_Management_System',
  'hr-portal-project/server',
  'hr-portal-project/hr-employee-portal',
  'taxi-booking-app/server',
  'taxi-booking-app/book-a-taxi',
  'online-food-ordering-app',
  'qa',
];
for (const directory of directories) {
  const cwd = path.join(root, directory);
  for (const file of ['package.json', 'package-lock.json']) {
    if (!fs.existsSync(path.join(cwd, file))) throw new Error(`Missing ${directory}/${file}`);
  }
}
if (process.argv.includes('--list')) {
  console.log(JSON.stringify(directories, null, 2));
} else {
  const windows = process.platform === 'win32';
  // Windows cannot execute a .cmd file without a shell. This command is fixed;
  // no directory, environment value, or user input is interpolated into it.
  const npm = windows ? 'npm.cmd ci --no-fund' : 'npm';
  const args = windows ? [] : ['ci', '--no-fund'];
  for (const directory of directories) {
    console.log(`Installing locked browser-test dependencies: ${directory}`);
    const result = spawnSync(npm, args, {
      shell: windows,
      cwd: path.join(root, directory),
      env: { ...process.env, CYPRESS_INSTALL_BINARY: '0' },
      stdio: 'inherit',
      windowsHide: true,
    });
    if (result.error) { console.error(result.error.message); process.exitCode = 1; break; }
    if (result.status !== 0) { process.exitCode = result.status ?? 1; break; }
  }
}
