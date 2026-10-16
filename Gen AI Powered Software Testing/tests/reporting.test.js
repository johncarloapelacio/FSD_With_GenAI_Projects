const { requirements, testCases, buildRtm, buildExecutionResults, buildTestReport, testReportToMarkdown, rtmToMarkdown } = require("../src");

const sample = testCases[0];
const suite = (assertionResults, extra = {}) => ({ name: sample.jestFile, assertionResults, ...extra });
const assertion = (status, suffix = "", id = sample.id) => ({ fullName: `suite ${id} executes scenario ${suffix}`, status, duration: 2 });

describe("RTM evidence integrity", () => {
  test("TC-REP-001 distinguishes local implementation from catalog-only and partial simulation", () => {
    const rtm = buildRtm(requirements, testCases);
    expect(rtm.find((r) => r.requirementId === "REQ-CHAT-001").coverageStatus).toBe("Catalog review only");
    expect(rtm.find((r) => r.requirementId === "REQ-INT-002").coverageStatus).toMatch(/^Partial/);
    expect(rtm.find((r) => r.requirementId === "REQ-KYC-001").coverageStatus).toBe("Local implementation checks");
    expect(rtm.every((row) => row.testCases.length > 0)).toBe(true);
  });

  test("TC-REP-001 no execution never means passed", () => {
    const results = buildExecutionResults(testCases);
    expect(Object.values(results).every((r) => r.status === "Not Run" && !r.executedBy)).toBe(true);
    const report = buildTestReport(requirements, testCases, buildRtm(requirements, testCases, results), results);
    expect(report.summary.mappingPercent).toBe(100);
    expect(report.summary.passedTests).toBe(0);
    expect(report.summary.notRunTests).toBe(testCases.length);
    expect(report.summary.jestRun).toBeNull();
    expect(report.summary.catalogReviewOnlyRequirements).toBeGreaterThan(0);
    expect(buildTestReport([], [], [], {}).summary.mappingPercent).toBe(0);
  });

  test.each([
    [[assertion("passed")], "Passed"],
    [[assertion("passed"), assertion("failed", "boundary")], "Failed"],
    [[assertion("passed"), assertion("pending", "skipped")], "Skipped"],
    [[assertion("todo")], "Skipped"],
    [[], "Not Run"]
  ])("TC-REP-001 aggregates observed assertion statuses %#", (assertions, expected) => {
    const results = buildExecutionResults(testCases, { testResults: [suite(assertions)] });
    expect(results[sample.id].status).toBe(expected);
    expect(results[sample.id].assertionCount).toBe(assertions.length);
  });

  test("TC-REP-001 failed suite initialization cannot produce a pass", () => {
    const results = buildExecutionResults(testCases, { testResults: [suite([], { testExecError: { message: "load failed" } })] });
    expect(results[sample.id].status).toBe("Failed");
  });

  test("TC-REP-001 ignores unrelated IDs and assertions in wrong files", () => {
    const results = buildExecutionResults(testCases, { testResults: [
      suite([assertion("passed", "", `${sample.id}0`)]),
      { name: "tests/unrelated.test.js", assertionResults: [assertion("passed")] }
    ] });
    expect(results[sample.id].status).toBe("Not Run");
  });
});


test("TC-REP-001 human-readable artifacts disclose unexecuted results and mapping limits", () => {
  const results = buildExecutionResults(testCases);
  const rtm = buildRtm(requirements, testCases, results);
  const report = buildTestReport(requirements, testCases, rtm, results);
  expect(testReportToMarkdown(report)).toContain("passed: 0");
  expect(testReportToMarkdown(report)).toContain("not run: 7");
  expect(testReportToMarkdown(report)).toContain("not functional test coverage");
  expect(rtmToMarkdown(rtm)).toContain("Not Run");
  expect(rtmToMarkdown(rtm)).toContain("Catalog review only");
});
