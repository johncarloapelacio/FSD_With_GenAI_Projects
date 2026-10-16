const { runCLI } = require("jest");
const path = require("path");
const { generateArtifacts } = require("./generate-artifacts");
(async () => {
  const { results } = await runCLI({ runInBand: true, coverage: process.argv.includes("--coverage"), watch: false, watchAll: false }, [path.resolve(__dirname, "..")]);
  generateArtifacts(results);
  process.exitCode = results.success ? 0 : 1;
})().catch((error) => {
  console.error(error);
  generateArtifacts();
  process.exitCode = 1;
});
