const { requirements, epics, userStories, sprintPlan, promptLog } = require("./requirements");
const { testCases } = require("./testCases");
const { generateKycCustomers } = require("./generators/kycGenerator");
const { generateAmlScenarios, TYPOLOGIES } = require("./generators/amlGenerator");
const { calculateKycRisk, hasCompleteKycProfile, requiresManualReview } = require("./rules/kycRules");
const { evaluateTransaction, evaluateAmlScenario } = require("./rules/amlRules");
const {
  buildRtm,
  buildExecutionResults,
  buildTestReport,
  rtmToMarkdown,
  testReportToMarkdown
} = require("./reporting/reportBuilder");

module.exports = {
  requirements,
  epics,
  userStories,
  sprintPlan,
  promptLog,
  testCases,
  generateKycCustomers,
  generateAmlScenarios,
  TYPOLOGIES,
  calculateKycRisk,
  hasCompleteKycProfile,
  requiresManualReview,
  evaluateTransaction,
  evaluateAmlScenario,
  buildRtm,
  buildExecutionResults,
  buildTestReport,
  rtmToMarkdown,
  testReportToMarkdown
};
