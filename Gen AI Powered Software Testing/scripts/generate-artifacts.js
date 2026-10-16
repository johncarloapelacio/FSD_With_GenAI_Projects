const fs = require("fs");
const path = require("path");
const {
  requirements,
  epics,
  userStories,
  sprintPlan,
  testCases,
  generateKycCustomers,
  generateAmlScenarios,
  buildRtm,
  buildExecutionResults,
  buildTestReport,
  rtmToMarkdown,
  testReportToMarkdown
} = require("../src");

const root = path.resolve(__dirname, "..");

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), value);
}

function requirementsMarkdown() {
  const lines = [
    "# Requirements Catalog",
    "",
    "Target requirements for KYC onboarding, transaction monitoring, integrations, and reporting. The execution report separates implemented local checks from planned capabilities.",
    ""
  ];

  requirements.forEach((requirement) => {
    lines.push(`## ${requirement.id}: ${requirement.title}`);
    lines.push("");
    lines.push(`- Category: ${requirement.category}`);
    lines.push(`- Priority: ${requirement.priority}`);
    lines.push(`- Description: ${requirement.description}`);
    lines.push("- Acceptance Criteria:");
    requirement.acceptanceCriteria.forEach((criterion) => lines.push(`  - ${criterion}`));
    lines.push("");
  });

  return lines.join("\n");
}

function agilePlanMarkdown() {
  const lines = [
    "# Agile Delivery Plan",
    "",
    "## Epics",
    ""
  ];

  epics.forEach((epic) => {
    lines.push(`### ${epic.id}: ${epic.title}`);
    lines.push("");
    lines.push(epic.description);
    lines.push("");
    lines.push(`Requirements: ${epic.requirementIds.join(", ")}`);
    lines.push("");
  });

  lines.push("## User Stories, Story Points, and Priority");
  lines.push("");
  lines.push("| Story | Epic | Priority | Points | Sprint | Requirements |");
  lines.push("| --- | --- | --- | ---: | ---: | --- |");
  userStories.forEach((story) => {
    lines.push(
      `| ${story.id}: ${story.title} | ${story.epicId} | ${story.priority} | ${story.storyPoints} | ${story.sprint} | ${story.requirementIds.join(", ")} |`
    );
  });

  lines.push("");
  lines.push("## Sprint Plan");
  lines.push("");
  sprintPlan.forEach((sprint) => {
    lines.push(`### Sprint ${sprint.sprint}`);
    lines.push("");
    lines.push(`Goal: ${sprint.goal}`);
    lines.push("");
    lines.push(`Stories: ${sprint.storyIds.join(", ")}`);
    lines.push("");
    lines.push(`Planned points: ${sprint.plannedPoints}`);
    lines.push("");
    lines.push(`Progress monitoring: ${sprint.monitoring}`);
    lines.push("");
  });

  lines.push("## Conflict Resolution and Sprint Adjustment");
  lines.push("");
  lines.push(
    "Capacity scenario: one tester and one compliance reviewer become unavailable during Sprint 2. Keep AML rule checks and requirements traceability in scope, defer lower-priority chatbot status work, and pair the remaining tester with the analyst for scenario review. This is a planning exercise, not a record of a staffed delivery team."
  );
  lines.push("");
  lines.push(
    "The adjusted plan kept Sprint 2 focused on AML typology coverage and sanctions/PEP risk scoring, while Sprint 3 absorbed reporting polish and performance checks. Progress monitoring shifted from broad task completion to evidence-based gates: typology present, rule tested, requirement mapped, and report generated."
  );
  lines.push("");

  return lines.join("\n");
}

function implementationNotesMarkdown(testReport) {
  const summary = testReport.summary;
  return [
    "# Implementation Notes",
    "",
    "## Data and rule checks",
    "",
    "Independent seeded Faker instances create repeatable KYC customer profiles and AML transactions. Fixed reference dates keep fixtures stable across runs. Local checks validate profile completeness, illustrative risk scores, transaction alerts, unique identifiers, and generation performance.",
    "",
    "Risk thresholds, country lists, and watchlist text markers are simplified examples. They do not perform live identity verification or sanctions screening.",
    "",
    "## Requirements and execution evidence",
    "",
    `The catalog maps ${summary.mappedRequirements}/${summary.totalRequirements} requirements to ${summary.totalTestCases} cases. Requirement mapping records traceability; it does not establish that every acceptance criterion is implemented.`,
    "",
    "npm test runs Jest and builds reports from the observed assertion and suite results. Failed, skipped, and unexecuted cases retain their status. npm run generate rebuilds documents and data without claiming test execution. See reports/test-report.md for run evidence and reports/rtm.md for requirement scope.",
    "",
    "## Planning documents",
    "",
    "The requirements catalog and Agile plan include proposed chatbot, NLP, escalation, and banking integration work. These capabilities are not implemented by this local framework. Story points, sprints, and capacity adjustments are planning examples.",
    "",
    "## Runtime boundaries",
    "",
    "The framework runs locally in JavaScript with Jest and uses synthetic data. It does not connect to banking systems, identity providers, NLP models, or external screening services. Performance tests measure local generation and rule evaluation, not network or production service latency.",
    ""
  ].join("\n");
}

function generateArtifacts(jestResults) {
  const start = Date.now();
  const customers = generateKycCustomers(30);
  const amlScenarios = generateAmlScenarios(customers);
  const executionResults = buildExecutionResults(testCases, jestResults);
  const rtm = buildRtm(requirements, testCases, executionResults);
  const testReport = buildTestReport(requirements, testCases, rtm, executionResults, jestResults);
  const elapsedMs = Date.now() - start;
  for (const dir of ["data/generated", "reports", "docs"]) fs.mkdirSync(path.join(root, dir), { recursive: true });

  writeJson("data/generated/kyc-customers.json", customers);
  writeJson("data/generated/aml-scenarios.json", amlScenarios);
  writeJson("data/generated/test-cases.json", testCases);
  writeJson("reports/rtm.json", rtm);
  writeJson("reports/execution-summary.json", {
    generatedAt: new Date().toISOString(),
    artifactGenerationElapsedMs: elapsedMs,
    generatedCustomerCount: customers.length,
    generatedTransactionCount: amlScenarios.length,
    mappedTestCaseCount: testCases.length,
    summary: testReport.summary,
    executionResults: testReport.executionResults
  });

  writeText("reports/rtm.md", rtmToMarkdown(rtm));
  writeText("reports/test-report.md", testReportToMarkdown(testReport));
  writeText("docs/requirements.md", requirementsMarkdown());
  writeText("docs/agile-plan.md", agilePlanMarkdown());
  writeText("docs/implementation-notes.md", implementationNotesMarkdown(testReport));

  console.log(`Generated ${customers.length} KYC customers, ${amlScenarios.length} AML transactions, and ${testCases.length} test cases.`);
  console.log(`Catalog mapping: ${testReport.summary.mappingPercent}% (not functional coverage). Artifact generation took ${elapsedMs}ms.`);
}

if (require.main === module) generateArtifacts();
module.exports = { generateArtifacts };
