const fs = require("fs");
const path = require("path");
const {
  requirements,
  epics,
  userStories,
  sprintPlan,
  promptLog,
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
    "The following requirements were created from the assignment prompt for an AI-assisted KYC and anti-money laundering banking platform.",
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
    "A realistic project disruption was modeled where one automation tester and one compliance subject matter expert became unavailable during Sprint 2. Generative AI was used to re-rank the backlog by regulatory risk and delivery dependency. The team preserved must-have AML and RTM work, moved lower-risk chatbot status refinements behind core compliance tests, and paired the remaining QA engineer with the business analyst for scenario review."
  );
  lines.push("");
  lines.push(
    "The adjusted plan kept Sprint 2 focused on AML typology coverage and sanctions/PEP risk scoring, while Sprint 3 absorbed reporting polish and performance checks. Progress monitoring shifted from broad task completion to evidence-based gates: typology present, rule tested, requirement mapped, and report generated."
  );
  lines.push("");

  return lines.join("\n");
}

function genAiReportMarkdown(testReport) {
  const lines = [
    "# Generative AI Assisted Testing Report",
    "",
    "## Executive Summary",
    "",
    "This project demonstrates how generative AI can accelerate test management for a banking KYC and AML platform. The work converts a broad problem statement into structured requirements, epics, user stories, prioritized sprint work, synthetic data, automated Jest tests, an RTM, and execution reporting.",
    "",
    "## How Generative AI Enhanced the Development Process",
    "",
    "Generative AI was used as a planning and quality accelerator. It helped decompose the assignment into requirement categories, propose acceptance criteria, identify AML typologies, define synthetic data fields, create test scenarios, and maintain traceability from requirements to evidence. Human judgment remained important for narrowing scope, keeping data synthetic, selecting deterministic generation, and making the deliverables runnable in JavaScript.",
    "",
    "## Prompt Log",
    ""
  ];

  promptLog.forEach((entry) => {
    lines.push(`### ${entry.id}: ${entry.purpose}`);
    lines.push("");
    lines.push(`Prompt: ${entry.prompt}`);
    lines.push("");
    lines.push(`Output used: ${entry.outputSummary}`);
    lines.push("");
  });

  lines.push("## Epics and User Stories");
  lines.push("");
  epics.forEach((epic) => {
    lines.push(`- ${epic.id}: ${epic.title} - ${epic.description}`);
  });
  lines.push("");
  userStories.forEach((story) => {
    lines.push(`- ${story.id}: ${story.title}; ${story.storyPoints} points; ${story.priority} priority; Sprint ${story.sprint}.`);
  });

  lines.push("");
  lines.push("## Story Point Estimation and Prioritization");
  lines.push("");
  lines.push(
    "Story points were estimated by complexity, compliance risk, integration uncertainty, and testing effort. High-priority stories are tied to must-have KYC, AML, screening, and reporting requirements. Medium-priority work supports resilience and performance once the core compliance evidence is stable."
  );

  lines.push("");
  lines.push("## Sprint Execution and Monitoring");
  lines.push("");
  sprintPlan.forEach((sprint) => {
    lines.push(`- Sprint ${sprint.sprint}: ${sprint.goal} Monitoring approach: ${sprint.monitoring}`);
  });

  lines.push("");
  lines.push("## Challenges and Resolution");
  lines.push("");
  lines.push(
    "The main challenge was balancing a broad platform vision with a training-project scope. The solution was to represent external systems with synthetic fields and local rule evaluators while preserving realistic requirement coverage. A second challenge was repeatability: seeded faker generation was selected so test evidence remains stable across runs. A third challenge was team-capacity conflict; the sprint plan was adjusted by protecting must-have compliance scope and delaying lower-risk enhancements."
  );

  lines.push("");
  lines.push("## Critical Analysis of Outcomes");
  lines.push("");
  lines.push(
    `The generated RTM covers ${testReport.summary.coveredRequirements}/${testReport.summary.totalRequirements} requirements, with ${testReport.summary.totalTestCases} mapped test cases. This is effective for demonstrating traceability and automated evidence. The main limitation is that production integrations, model confidence metrics, and external sanctions services are simulated, so enterprise adoption would require contract tests, security testing, privacy review, and live-service performance baselines.`
  );

  lines.push("");
  lines.push("## Conclusion");
  lines.push("");
  lines.push(
    "Generative AI improved speed and completeness by turning ambiguous goals into structured artifacts. The strongest outcome is traceability: every major assignment area is represented by requirements, test data, test cases, automated execution, and reporting evidence."
  );
  lines.push("");

  return lines.join("\n");
}

function main() {
  const start = Date.now();
  const customers = generateKycCustomers(30);
  const amlScenarios = generateAmlScenarios(customers);
  const executionResults = buildExecutionResults(testCases);
  const rtm = buildRtm(requirements, testCases, executionResults);
  const testReport = buildTestReport(requirements, testCases, rtm, executionResults);
  const elapsedMs = Date.now() - start;

  writeJson("data/generated/kyc-customers.json", customers);
  writeJson("data/generated/aml-scenarios.json", amlScenarios);
  writeJson("data/generated/test-cases.json", testCases);
  writeJson("reports/rtm.json", rtm);
  writeJson("reports/execution-summary.json", {
    generatedAt: new Date().toISOString(),
    elapsedMs,
    generatedCustomerCount: customers.length,
    generatedTransactionCount: amlScenarios.length,
    mappedTestCaseCount: testCases.length,
    coveragePercent: testReport.summary.coveragePercent
  });

  writeText("reports/rtm.md", rtmToMarkdown(rtm));
  writeText("reports/test-report.md", testReportToMarkdown(testReport));
  writeText("docs/requirements.md", requirementsMarkdown());
  writeText("docs/agile-plan.md", agilePlanMarkdown());
  writeText("docs/genai-process-report.md", genAiReportMarkdown(testReport));

  console.log(`Generated ${customers.length} KYC customers, ${amlScenarios.length} AML transactions, and ${testCases.length} test cases.`);
  console.log(`RTM coverage: ${testReport.summary.coveragePercent}%. Artifact generation took ${elapsedMs}ms.`);
}

main();
