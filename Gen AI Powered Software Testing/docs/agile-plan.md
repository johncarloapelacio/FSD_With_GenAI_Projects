# Agile Delivery Plan

## Epics

### EPIC-001: AI-guided KYC onboarding

Deliver chatbot-supported customer onboarding with NLP-driven data capture and document guidance.

Requirements: REQ-CHAT-001, REQ-NLP-001, REQ-NLP-002, REQ-KYC-001

### EPIC-002: AML monitoring and risk detection

Detect suspicious transaction behavior using representative AML scenarios and risk rules.

Requirements: REQ-AML-001, REQ-INT-002

### EPIC-003: Banking integration and service continuity

Connect compliance workflows to core banking, CRM, identity verification, and case escalation systems.

Requirements: REQ-CHAT-002, REQ-INT-001, REQ-INT-002

### EPIC-004: Automated testing evidence and delivery governance

Generate repeatable test data, execute Jest tests, map coverage to RTM, and report delivery progress.

Requirements: REQ-SCALE-001, REQ-PERF-001, REQ-REP-001

## User Stories, Story Points, and Priority

| Story | Epic | Priority | Points | Sprint | Requirements |
| --- | --- | --- | ---: | ---: | --- |
| US-001: Complete chatbot KYC onboarding | EPIC-001 | High | 8 | 1 | REQ-CHAT-001, REQ-KYC-001 |
| US-002: Recognize onboarding intents and entities | EPIC-001 | High | 5 | 1 | REQ-NLP-001, REQ-NLP-002 |
| US-003: Generate synthetic KYC profiles | EPIC-004 | High | 5 | 1 | REQ-KYC-001, REQ-SCALE-001 |
| US-004: Generate AML typology scenarios | EPIC-002 | High | 8 | 2 | REQ-AML-001 |
| US-005: Screen PEP and sanctions risk | EPIC-002 | High | 5 | 2 | REQ-INT-002, REQ-AML-001 |
| US-006: Escalate unresolved chatbot interactions | EPIC-003 | Medium | 3 | 2 | REQ-CHAT-002, REQ-INT-001 |
| US-007: Automate RTM and test reporting | EPIC-004 | High | 5 | 3 | REQ-REP-001 |
| US-008: Measure repeatability and performance | EPIC-004 | Medium | 3 | 3 | REQ-SCALE-001, REQ-PERF-001 |

## Sprint Plan

### Sprint 1

Goal: Establish requirements, chatbot KYC flow, NLP scope, and KYC synthetic data foundation.

Stories: US-001, US-002, US-003

Planned points: 18

Progress monitoring: Daily review of generated requirements, test data schema completeness, and open validation defects.

### Sprint 2

Goal: Add AML typology data, screening/risk logic, and escalation workflow coverage.

Stories: US-004, US-005, US-006

Planned points: 16

Progress monitoring: Track rule coverage by typology, review high-risk false positives, and confirm integration assumptions.

### Sprint 3

Goal: Complete RTM automation, reporting, performance checks, and release evidence.

Stories: US-007, US-008

Planned points: 8

Progress monitoring: Review RTM gaps, stabilize Jest execution, and confirm all must-have requirements have passing coverage.

## Conflict Resolution and Sprint Adjustment

A realistic project disruption was modeled where one automation tester and one compliance subject matter expert became unavailable during Sprint 2. Generative AI was used to re-rank the backlog by regulatory risk and delivery dependency. The team preserved must-have AML and RTM work, moved lower-risk chatbot status refinements behind core compliance tests, and paired the remaining QA engineer with the business analyst for scenario review.

The adjusted plan kept Sprint 2 focused on AML typology coverage and sanctions/PEP risk scoring, while Sprint 3 absorbed reporting polish and performance checks. Progress monitoring shifted from broad task completion to evidence-based gates: typology present, rule tested, requirement mapped, and report generated.
