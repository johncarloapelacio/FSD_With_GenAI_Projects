function buildRtm(requirements, testCases, executionResults = {}) {
  return requirements.map((requirement) => {
    const mappedTests = testCases
      .filter((testCase) => testCase.requirementIds.includes(requirement.id))
      .map((testCase) => ({
        testCaseId: testCase.id,
        title: testCase.title,
        automated: testCase.automated,
        status: executionResults[testCase.id]?.status || "Not Run",
        evidence: executionResults[testCase.id]?.evidence || testCase.jestFile
      }));

    return {
      requirementId: requirement.id,
      category: requirement.category,
      title: requirement.title,
      priority: requirement.priority,
      coverageStatus: mappedTests.length > 0 ? "Covered" : "Not Covered",
      testCases: mappedTests
    };
  });
}

function buildExecutionResults(testCases, status = "Passed") {
  return Object.fromEntries(
    testCases.map((testCase) => [
      testCase.id,
      {
        status,
        evidence: testCase.jestFile,
        executedBy: "Jest automated test suite"
      }
    ])
  );
}

function buildTestReport(requirements, testCases, rtm, executionResults) {
  const totalRequirements = requirements.length;
  const coveredRequirements = rtm.filter((row) => row.coverageStatus === "Covered").length;
  const automatedTests = testCases.filter((testCase) => testCase.automated).length;
  const passedTests = Object.values(executionResults).filter((result) => result.status === "Passed").length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRequirements,
      coveredRequirements,
      coveragePercent: Math.round((coveredRequirements / totalRequirements) * 100),
      totalTestCases: testCases.length,
      automatedTests,
      passedTests
    },
    risksAndNotes: [
      "External service integrations are represented by test doubles and synthetic screening fields.",
      "Generated data is deterministic for repeatable evidence and does not represent real customers.",
      "Performance threshold is local to this training project and should be recalibrated for enterprise environments."
    ],
    rtm
  };
}

function rtmToMarkdown(rtm) {
  const header = [
    "# Requirements Traceability Matrix",
    "",
    "| Requirement | Category | Priority | Coverage | Test Cases |",
    "| --- | --- | --- | --- | --- |"
  ];

  const rows = rtm.map((row) => {
    const tests = row.testCases.map((testCase) => `${testCase.testCaseId} (${testCase.status})`).join("<br>");
    return `| ${row.requirementId}: ${row.title} | ${row.category} | ${row.priority} | ${row.coverageStatus} | ${tests || "None"} |`;
  });

  return [...header, ...rows, ""].join("\n");
}

function testReportToMarkdown(report) {
  const lines = [
    "# Test Execution Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Requirements covered: ${report.summary.coveredRequirements}/${report.summary.totalRequirements} (${report.summary.coveragePercent}%)`,
    `- Test cases: ${report.summary.totalTestCases}`,
    `- Automated tests: ${report.summary.automatedTests}`,
    `- Passed mapped tests: ${report.summary.passedTests}`,
    "",
    "## Risks and Notes",
    "",
    ...report.risksAndNotes.map((note) => `- ${note}`),
    "",
    "## Requirement Results",
    ""
  ];

  report.rtm.forEach((row) => {
    lines.push(`### ${row.requirementId}: ${row.title}`);
    lines.push("");
    lines.push(`Coverage: ${row.coverageStatus}`);
    lines.push("");
    row.testCases.forEach((testCase) => {
      lines.push(`- ${testCase.testCaseId}: ${testCase.title} - ${testCase.status}`);
    });
    lines.push("");
  });

  return lines.join("\n");
}

module.exports = {
  buildRtm,
  buildExecutionResults,
  buildTestReport,
  rtmToMarkdown,
  testReportToMarkdown
};
