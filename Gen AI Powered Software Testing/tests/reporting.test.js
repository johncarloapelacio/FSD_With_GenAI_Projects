const { requirements, testCases, buildRtm, buildExecutionResults, buildTestReport } = require("../src");

describe("RTM and test report generation", () => {
  test("TC-REP-001 maps every must-have requirement to automated coverage", () => {
    const rtm = buildRtm(requirements, testCases, buildExecutionResults(testCases));
    const mustHaveRequirements = rtm.filter((row) => row.priority === "Must Have");

    expect(rtm).toHaveLength(requirements.length);
    mustHaveRequirements.forEach((row) => {
      expect(row.coverageStatus).toBe("Covered");
      expect(row.testCases.some((testCase) => testCase.automated)).toBe(true);
    });
  });

  test("test report summarizes complete requirement coverage", () => {
    const executionResults = buildExecutionResults(testCases);
    const rtm = buildRtm(requirements, testCases, executionResults);
    const report = buildTestReport(requirements, testCases, rtm, executionResults);

    expect(report.summary.coveragePercent).toBe(100);
    expect(report.summary.passedTests).toBe(testCases.length);
  });
});
