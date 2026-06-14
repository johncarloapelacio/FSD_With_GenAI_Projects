# Requirements Catalog

The following requirements were created from the assignment prompt for an AI-assisted KYC and anti-money laundering banking platform.

## REQ-CHAT-001: Guided KYC onboarding conversation

- Category: Chatbot Functionality
- Priority: Must Have
- Description: The platform shall guide customers through KYC onboarding using conversational prompts for identity, address, employment, source of funds, and document upload.
- Acceptance Criteria:
  - Customer can complete all required KYC sections through the chatbot.
  - The chatbot resumes an incomplete onboarding session without losing prior answers.
  - Required fields are clearly requested before submission.

## REQ-CHAT-002: Case status and escalation support

- Category: Chatbot Functionality
- Priority: Must Have
- Description: The chatbot shall provide KYC/AML case status and route unresolved or high-risk interactions to compliance staff.
- Acceptance Criteria:
  - Customer receives a status for submitted KYC review.
  - High-risk or ambiguous requests create an escalation record.
  - Escalation includes customer ID, reason, timestamp, and conversation summary.

## REQ-NLP-001: Intent recognition for banking compliance journeys

- Category: NLP Capabilities
- Priority: Must Have
- Description: The NLP layer shall classify customer intents for onboarding, document help, profile updates, transaction questions, suspicious activity questions, and human-agent requests.
- Acceptance Criteria:
  - Intent confidence is returned for every classified message.
  - Low-confidence messages are clarified or escalated.
  - Compliance-sensitive intents are logged for audit review.

## REQ-NLP-002: Entity extraction for KYC and AML fields

- Category: NLP Capabilities
- Priority: Should Have
- Description: The platform shall extract entities such as legal name, date of birth, address, country, occupation, beneficial owner, transaction amount, currency, and counterparty.
- Acceptance Criteria:
  - Extracted entities map to the KYC profile schema.
  - Invalid or missing entities trigger a correction prompt.
  - Financial entities support transaction monitoring tests.

## REQ-INT-001: Core banking and CRM integration

- Category: Integration
- Priority: Must Have
- Description: The platform shall integrate with core banking and CRM systems to retrieve customer profiles, account status, and service history.
- Acceptance Criteria:
  - Customer profile lookup uses a stable customer identifier.
  - Integration failures return a recoverable error path.
  - Sensitive data is masked in application logs.

## REQ-INT-002: Identity verification and sanctions screening integration

- Category: Integration
- Priority: Must Have
- Description: The platform shall integrate with identity verification, PEP, sanctions, adverse media, and watchlist screening services.
- Acceptance Criteria:
  - Identity verification result is stored with evidence metadata.
  - Sanctions and PEP matches affect customer risk score.
  - Screening retries are handled without duplicate case creation.

## REQ-KYC-001: Complete synthetic KYC customer profiles

- Category: KYC Data
- Priority: Must Have
- Description: The test framework shall generate synthetic customer profiles with identity, contact, address, employment, risk, document, and screening fields.
- Acceptance Criteria:
  - Generated profiles contain no real customer data.
  - Each customer includes a unique customer ID and document ID.
  - The dataset includes low, medium, and high-risk customers.

## REQ-AML-001: Synthetic AML transaction scenarios

- Category: AML Monitoring
- Priority: Must Have
- Description: The test framework shall generate transactions that represent normal activity, structuring, rapid movement of funds, high-risk geography, and sanctions exposure.
- Acceptance Criteria:
  - Generated transactions include amount, currency, parties, country, channel, timestamp, and risk indicators.
  - At least one scenario triggers each AML typology rule.
  - Scenario labels are traceable to test cases.

## REQ-SCALE-001: Scalable test data generation

- Category: Scalability
- Priority: Should Have
- Description: The JavaScript generators shall support configurable record counts for KYC customers and AML scenarios.
- Acceptance Criteria:
  - The generator can create repeatable datasets using a seed.
  - Record count is configurable without changing test logic.
  - Generated IDs remain unique at larger sample sizes.

## REQ-PERF-001: Performance expectations for compliance workflows

- Category: Performance
- Priority: Should Have
- Description: The platform shall target responsive chatbot and screening workflows, with automated tests documenting expected thresholds.
- Acceptance Criteria:
  - Synthetic data generation completes within the defined test threshold.
  - Risk evaluation runs without external service dependency.
  - Reports include execution timing evidence.

## REQ-REP-001: RTM and test report generation

- Category: Reporting
- Priority: Must Have
- Description: The framework shall generate a Requirements Traceability Matrix and test report mapping requirements to test cases, execution status, and evidence.
- Acceptance Criteria:
  - Every test case maps to at least one requirement.
  - Every must-have requirement has test coverage.
  - Reports are generated in machine-readable JSON and human-readable Markdown.
