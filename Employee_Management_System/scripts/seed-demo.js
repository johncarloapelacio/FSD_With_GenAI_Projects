try {
  require('../lib/demo').installDemo();
  console.log('Synthetic demo accounts created. Demo credentials are in README.md.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
