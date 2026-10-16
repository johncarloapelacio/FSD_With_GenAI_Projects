# Implementation Notes

## Data and rule checks

Independent seeded Faker instances create repeatable KYC customer profiles and AML transactions. Fixed reference dates keep fixtures stable across runs. Local checks validate profile completeness, illustrative risk scores, transaction alerts, unique identifiers, and generation performance.

Risk thresholds, country lists, and watchlist text markers are simplified examples. They do not perform live identity verification or sanctions screening.

## Requirements and execution evidence

The catalog maps 11/11 requirements to 7 cases. Requirement mapping records traceability; it does not establish that every acceptance criterion is implemented.

npm test runs Jest and builds reports from the observed assertion and suite results. Failed, skipped, and unexecuted cases retain their status. npm run generate rebuilds documents and data without claiming test execution. See reports/test-report.md for run evidence and reports/rtm.md for requirement scope.

## Planning documents

The requirements catalog and Agile plan include proposed chatbot, NLP, escalation, and banking integration work. These capabilities are not implemented by this local framework. Story points, sprints, and capacity adjustments are planning examples.

## Runtime boundaries

The framework runs locally in JavaScript with Jest and uses synthetic data. It does not connect to banking systems, identity providers, NLP models, or external screening services. Performance tests measure local generation and rule evaluation, not network or production service latency.
