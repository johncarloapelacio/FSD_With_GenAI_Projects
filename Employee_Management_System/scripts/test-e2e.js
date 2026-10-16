const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ems-e2e-'));
  process.env.EMS_DATA_DIR = temporary;
  process.env.EMS_E2E = '1';
  process.env.NODE_ENV = 'test';
  let server;
  try {
    require('../lib/demo').installDemo();
    server = require('../app').listen(0, '127.0.0.1');
    await once(server, 'listening');
    const args = [require.resolve('cypress/bin'), process.argv.includes('--open') ? 'open' : 'run', '--config', `baseUrl=http://127.0.0.1:${server.address().port}`, ...process.argv.slice(2).filter((arg) => arg !== '--open')];
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(process.execPath, args, { cwd: path.join(__dirname, '..'), env, stdio: 'inherit', windowsHide: true });
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', (exitCode) => resolve(exitCode === null ? 1 : exitCode)); });
    process.exitCode = code;
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    // This path is created by mkdtemp and cannot point to user storage.
    if (path.dirname(path.resolve(temporary)) !== path.resolve(os.tmpdir()) || !path.basename(temporary).startsWith('ems-e2e-')) throw new Error('Unexpected cleanup path.');
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
