# GenAI Powered Software Testing Project

This project implements the assignment from `Gen AI Powered Software Testing Problem Statement.pdf`.

It provides a runnable JavaScript/Jest testing framework for a banking KYC and anti-money laundering platform, including requirements, epics, user stories, story points, sprint planning, synthetic data, automated test cases, RTM mapping, and generated reports.

## Project Structure

- `src/requirements.js` - requirements, epics, user stories, sprint plan, and GenAI prompt log.
- `src/generators/` - deterministic KYC and AML synthetic data generators using faker.
- `src/rules/` - KYC and AML validation/risk rules used by tests.
- `src/reporting/` - report and RTM generation utilities.
- `scripts/generate-artifacts.js` - creates JSON/Markdown deliverables.
- `tests/` - Jest tests for data quality, requirements coverage, KYC, AML, and report mapping.
- `data/generated/` - generated KYC/AML/test-case JSON files.
- `reports/` - generated RTM, test report, and execution summary.
- `docs/` - submission-ready project documentation.

## Setup

```bash
npm install
npm run generate
npm test
```

## Key Deliverables

After running `npm run generate`, review:

- `docs/requirements.md`
- `docs/agile-plan.md`
- `docs/genai-process-report.md`
- `data/generated/kyc-customers.json`
- `data/generated/aml-scenarios.json`
- `data/generated/test-cases.json`
- `reports/rtm.json`
- `reports/rtm.md`
- `reports/test-report.md`
- `reports/execution-summary.json`

## Notes

The data generators are seeded to keep the evidence repeatable for grading. All generated data is synthetic and intentionally excludes real customers, accounts, or transactions.
