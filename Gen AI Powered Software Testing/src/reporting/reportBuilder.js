const path = require("path");

function buildExecutionResults(testCases, jestResults) {
  return Object.fromEntries(testCases.map((testCase) => {
    const suites = jestResults?.testResults?.filter((suite) =>
      (testCase.jestFiles || [testCase.jestFile]).some((file) => path.normalize(suite.testFilePath || suite.name || "").endsWith(path.normalize(file)))) || [];
    const assertions = suites.flatMap((suite) => suite.testResults || suite.assertionResults || [])
      .filter((assertion) => new RegExp(`(^|\\s)${testCase.id}(?=\\s|$)`).test(assertion.fullName || assertion.title || ""));
    const suiteError = suites.some((suite) => suite.testExecError || suite.failureMessage && !(suite.testResults || suite.assertionResults || []).length);
    let status = "Not Run";
    if (suiteError || assertions.some((assertion) => assertion.status === "failed")) status = "Failed";
    else if (assertions.length && assertions.every((assertion) => assertion.status === "passed")) status = "Passed";
    else if (assertions.length) status = "Skipped";
    return [testCase.id, {
      status,
      evidence: assertions.length ? assertions.map((assertion) => assertion.fullName || assertion.title) : [],
      jestFile: testCase.jestFile,
      assertionCount: assertions.length,
      durationMs: assertions.reduce((sum, assertion) => sum + (assertion.duration || 0), 0),
      executedBy: status === "Not Run" ? null : "Observed Jest execution"
    }];
  }));
}

function buildRtm(requirements, testCases, executionResults = {}) {
  return requirements.map((requirement) => {
    const mappedTests = testCases.filter((testCase) => testCase.requirementIds.includes(requirement.id)).map((testCase) => ({
      testCaseId: testCase.id,
      title: testCase.title,
      automated: testCase.automated,
      scope: testCase.type === "Requirements Review" ? "Catalog review" : "Local implementation check",
      status: executionResults[testCase.id]?.status || "Not Run",
      evidence: executionResults[testCase.id]?.evidence || [],
      durationMs: executionResults[testCase.id]?.durationMs ?? null
    }));
    const hasLocalChecks = mappedTests.some((testCase) => testCase.scope === "Local implementation check");
    return {
      requirementId: requirement.id,
      category: requirement.category,
      title: requirement.title,
      priority: requirement.priority,
      coverageStatus: hasLocalChecks ? (requirement.category === "Integration" ? "Partial: simulated signals only" : "Local implementation checks") : (mappedTests.length ? "Catalog review only" : "Not mapped"),
      testCases: mappedTests
    };
  });
}

function buildTestReport(requirements, testCases, rtm, executionResults, jestResults) {
  const mappedRequirements = rtm.filter((row) => row.testCases.length > 0).length;
  const results = testCases.map((testCase) => executionResults[testCase.id] || { status: "Not Run" });
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRequirements: requirements.length,
      mappedRequirements,
      mappingPercent: requirements.length ? Math.round(mappedRequirements / requirements.length * 100) : 0,
      requirementsWithLocalChecks: rtm.filter((row) => row.coverageStatus === "Local implementation checks").length,
      partiallySimulatedRequirements: rtm.filter((row) => row.coverageStatus.startsWith("Partial")).length,
      catalogReviewOnlyRequirements: rtm.filter((row) => row.coverageStatus === "Catalog review only").length,
      totalTestCases: testCases.length,
      automatedTests: testCases.filter((testCase) => testCase.automated).length,
      passedTests: results.filter((result) => result.status === "Passed").length,
      failedTests: results.filter((result) => result.status === "Failed").length,
      skippedTests: results.filter((result) => result.status === "Skipped").length,
      notRunTests: results.filter((result) => result.status === "Not Run").length,
      jestRun: jestResults ? {
        success: jestResults.success === true,
        passedAssertions: jestResults.numPassedTests,
        failedAssertions: jestResults.numFailedTests,
        skippedAssertions: jestResults.numPendingTests,
        totalAssertions: jestResults.numTotalTests,
        failedSuites: jestResults.numFailedTestSuites,
        elapsedMs: Math.max(0, Date.now() - jestResults.startTime)
      } : null
    },
    risksAndNotes: [
      "Mapping completeness is not functional acceptance coverage or source-code coverage.",
      "Chatbot, NLP, banking/CRM integration, live screening, retries, and log privacy are planned requirements; no such services are implemented or verified here.",
      "Risk rules use synthetic fields and illustrative thresholds, not regulatory guidance or a production AML detection model. Large single wires are a proxy, not evidence of rapid movement.",
      "Data uses fixed reference dates and seeds. Synthetic identities must not be used to contact people or screen real accounts.",
      "Performance results measure local generation and evaluation only, not banking service latency or capacity."
    ],
    executionResults,
    rtm
  };
}

function rtmToMarkdown(rtm) {
  return ["# Requirements Traceability Matrix", "", "Mapping a requirement does not verify its acceptance criteria. Catalog review checks documentation only.", "", "| Requirement | Category | Scope | Test Cases |", "| --- | --- | --- | --- |",
    ...rtm.map((row) => `| ${row.requirementId}: ${row.title} | ${row.category} | ${row.coverageStatus} | ${row.testCases.map((testCase) => `${testCase.testCaseId} (${testCase.status}; ${testCase.scope})`).join("<br>") || "None"} |`), ""].join("\n");
}

function testReportToMarkdown(report) {
  const s = report.summary;
  return ["# Test Execution Report", "", `Generated: ${report.generatedAt}`, "", "## Summary", "",
    `- Catalog mapping: ${s.mappedRequirements}/${s.totalRequirements} (${s.mappingPercent}%). This is not functional test coverage.`,
    `- Requirements with local implementation checks: ${s.requirementsWithLocalChecks}; partial simulation: ${s.partiallySimulatedRequirements}; catalog review only: ${s.catalogReviewOnlyRequirements}.`,
    `- Catalog cases: ${s.totalTestCases}; passed: ${s.passedTests}; failed: ${s.failedTests}; skipped: ${s.skippedTests}; not run: ${s.notRunTests}.`,
    s.jestRun ? `- Observed Jest run: ${s.jestRun.passedAssertions} passed / ${s.jestRun.totalAssertions} assertions; ${s.jestRun.failedAssertions} failed; ${s.jestRun.failedSuites} failed suites; ${s.jestRun.elapsedMs} ms. Overall success: ${s.jestRun.success}.` : "- No Jest execution was supplied. Run npm test to generate observed results.",
    "", "## Risks and Notes", "", ...report.risksAndNotes.map((note) => `- ${note}`), "", "## Requirement Results", "",
    ...report.rtm.flatMap((row) => [`### ${row.requirementId}: ${row.title}`, "", `Scope: ${row.coverageStatus}`, "", ...row.testCases.map((testCase) => `- ${testCase.testCaseId}: ${testCase.title} - ${testCase.status} (${testCase.scope})`), ""])].join("\n");
}

module.exports = { buildRtm, buildExecutionResults, buildTestReport, rtmToMarkdown, testReportToMarkdown };
