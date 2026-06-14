const requirements = [
  {
    id: "REQ-CHAT-001",
    category: "Chatbot Functionality",
    title: "Guided KYC onboarding conversation",
    description:
      "The platform shall guide customers through KYC onboarding using conversational prompts for identity, address, employment, source of funds, and document upload.",
    priority: "Must Have",
    acceptanceCriteria: [
      "Customer can complete all required KYC sections through the chatbot.",
      "The chatbot resumes an incomplete onboarding session without losing prior answers.",
      "Required fields are clearly requested before submission."
    ]
  },
  {
    id: "REQ-CHAT-002",
    category: "Chatbot Functionality",
    title: "Case status and escalation support",
    description:
      "The chatbot shall provide KYC/AML case status and route unresolved or high-risk interactions to compliance staff.",
    priority: "Must Have",
    acceptanceCriteria: [
      "Customer receives a status for submitted KYC review.",
      "High-risk or ambiguous requests create an escalation record.",
      "Escalation includes customer ID, reason, timestamp, and conversation summary."
    ]
  },
  {
    id: "REQ-NLP-001",
    category: "NLP Capabilities",
    title: "Intent recognition for banking compliance journeys",
    description:
      "The NLP layer shall classify customer intents for onboarding, document help, profile updates, transaction questions, suspicious activity questions, and human-agent requests.",
    priority: "Must Have",
    acceptanceCriteria: [
      "Intent confidence is returned for every classified message.",
      "Low-confidence messages are clarified or escalated.",
      "Compliance-sensitive intents are logged for audit review."
    ]
  },
  {
    id: "REQ-NLP-002",
    category: "NLP Capabilities",
    title: "Entity extraction for KYC and AML fields",
    description:
      "The platform shall extract entities such as legal name, date of birth, address, country, occupation, beneficial owner, transaction amount, currency, and counterparty.",
    priority: "Should Have",
    acceptanceCriteria: [
      "Extracted entities map to the KYC profile schema.",
      "Invalid or missing entities trigger a correction prompt.",
      "Financial entities support transaction monitoring tests."
    ]
  },
  {
    id: "REQ-INT-001",
    category: "Integration",
    title: "Core banking and CRM integration",
    description:
      "The platform shall integrate with core banking and CRM systems to retrieve customer profiles, account status, and service history.",
    priority: "Must Have",
    acceptanceCriteria: [
      "Customer profile lookup uses a stable customer identifier.",
      "Integration failures return a recoverable error path.",
      "Sensitive data is masked in application logs."
    ]
  },
  {
    id: "REQ-INT-002",
    category: "Integration",
    title: "Identity verification and sanctions screening integration",
    description:
      "The platform shall integrate with identity verification, PEP, sanctions, adverse media, and watchlist screening services.",
    priority: "Must Have",
    acceptanceCriteria: [
      "Identity verification result is stored with evidence metadata.",
      "Sanctions and PEP matches affect customer risk score.",
      "Screening retries are handled without duplicate case creation."
    ]
  },
  {
    id: "REQ-KYC-001",
    category: "KYC Data",
    title: "Complete synthetic KYC customer profiles",
    description:
      "The test framework shall generate synthetic customer profiles with identity, contact, address, employment, risk, document, and screening fields.",
    priority: "Must Have",
    acceptanceCriteria: [
      "Generated profiles contain no real customer data.",
      "Each customer includes a unique customer ID and document ID.",
      "The dataset includes low, medium, and high-risk customers."
    ]
  },
  {
    id: "REQ-AML-001",
    category: "AML Monitoring",
    title: "Synthetic AML transaction scenarios",
    description:
      "The test framework shall generate transactions that represent normal activity, structuring, rapid movement of funds, high-risk geography, and sanctions exposure.",
    priority: "Must Have",
    acceptanceCriteria: [
      "Generated transactions include amount, currency, parties, country, channel, timestamp, and risk indicators.",
      "At least one scenario triggers each AML typology rule.",
      "Scenario labels are traceable to test cases."
    ]
  },
  {
    id: "REQ-SCALE-001",
    category: "Scalability",
    title: "Scalable test data generation",
    description:
      "The JavaScript generators shall support configurable record counts for KYC customers and AML scenarios.",
    priority: "Should Have",
    acceptanceCriteria: [
      "The generator can create repeatable datasets using a seed.",
      "Record count is configurable without changing test logic.",
      "Generated IDs remain unique at larger sample sizes."
    ]
  },
  {
    id: "REQ-PERF-001",
    category: "Performance",
    title: "Performance expectations for compliance workflows",
    description:
      "The platform shall target responsive chatbot and screening workflows, with automated tests documenting expected thresholds.",
    priority: "Should Have",
    acceptanceCriteria: [
      "Synthetic data generation completes within the defined test threshold.",
      "Risk evaluation runs without external service dependency.",
      "Reports include execution timing evidence."
    ]
  },
  {
    id: "REQ-REP-001",
    category: "Reporting",
    title: "RTM and test report generation",
    description:
      "The framework shall generate a Requirements Traceability Matrix and test report mapping requirements to test cases, execution status, and evidence.",
    priority: "Must Have",
    acceptanceCriteria: [
      "Every test case maps to at least one requirement.",
      "Every must-have requirement has test coverage.",
      "Reports are generated in machine-readable JSON and human-readable Markdown."
    ]
  }
];

const epics = [
  {
    id: "EPIC-001",
    title: "AI-guided KYC onboarding",
    description:
      "Deliver chatbot-supported customer onboarding with NLP-driven data capture and document guidance.",
    requirementIds: ["REQ-CHAT-001", "REQ-NLP-001", "REQ-NLP-002", "REQ-KYC-001"]
  },
  {
    id: "EPIC-002",
    title: "AML monitoring and risk detection",
    description:
      "Detect suspicious transaction behavior using representative AML scenarios and risk rules.",
    requirementIds: ["REQ-AML-001", "REQ-INT-002"]
  },
  {
    id: "EPIC-003",
    title: "Banking integration and service continuity",
    description:
      "Connect compliance workflows to core banking, CRM, identity verification, and case escalation systems.",
    requirementIds: ["REQ-CHAT-002", "REQ-INT-001", "REQ-INT-002"]
  },
  {
    id: "EPIC-004",
    title: "Automated testing evidence and delivery governance",
    description:
      "Generate repeatable test data, execute Jest tests, map coverage to RTM, and report delivery progress.",
    requirementIds: ["REQ-SCALE-001", "REQ-PERF-001", "REQ-REP-001"]
  }
];

const userStories = [
  {
    id: "US-001",
    epicId: "EPIC-001",
    title: "Complete chatbot KYC onboarding",
    story:
      "As a retail banking customer, I want a chatbot to guide me through KYC onboarding so that I can submit a complete profile without visiting a branch.",
    requirementIds: ["REQ-CHAT-001", "REQ-KYC-001"],
    storyPoints: 8,
    priority: "High",
    sprint: 1
  },
  {
    id: "US-002",
    epicId: "EPIC-001",
    title: "Recognize onboarding intents and entities",
    story:
      "As a compliance product owner, I want the assistant to identify KYC intents and extract required entities so that the data can be validated consistently.",
    requirementIds: ["REQ-NLP-001", "REQ-NLP-002"],
    storyPoints: 5,
    priority: "High",
    sprint: 1
  },
  {
    id: "US-003",
    epicId: "EPIC-004",
    title: "Generate synthetic KYC profiles",
    story:
      "As a test manager, I want realistic synthetic KYC records so that testing covers valid, incomplete, and high-risk onboarding cases.",
    requirementIds: ["REQ-KYC-001", "REQ-SCALE-001"],
    storyPoints: 5,
    priority: "High",
    sprint: 1
  },
  {
    id: "US-004",
    epicId: "EPIC-002",
    title: "Generate AML typology scenarios",
    story:
      "As an AML analyst, I want transaction scenarios for common suspicious patterns so that detection rules can be tested before release.",
    requirementIds: ["REQ-AML-001"],
    storyPoints: 8,
    priority: "High",
    sprint: 2
  },
  {
    id: "US-005",
    epicId: "EPIC-002",
    title: "Screen PEP and sanctions risk",
    story:
      "As a compliance officer, I want PEP and sanctions indicators reflected in risk scoring so that elevated-risk customers are reviewed.",
    requirementIds: ["REQ-INT-002", "REQ-AML-001"],
    storyPoints: 5,
    priority: "High",
    sprint: 2
  },
  {
    id: "US-006",
    epicId: "EPIC-003",
    title: "Escalate unresolved chatbot interactions",
    story:
      "As a support manager, I want unresolved or high-risk chatbot cases escalated so that compliance staff can intervene.",
    requirementIds: ["REQ-CHAT-002", "REQ-INT-001"],
    storyPoints: 3,
    priority: "Medium",
    sprint: 2
  },
  {
    id: "US-007",
    epicId: "EPIC-004",
    title: "Automate RTM and test reporting",
    story:
      "As a test manager, I want automated RTM and test reports so that stakeholders can trace requirements to evidence.",
    requirementIds: ["REQ-REP-001"],
    storyPoints: 5,
    priority: "High",
    sprint: 3
  },
  {
    id: "US-008",
    epicId: "EPIC-004",
    title: "Measure repeatability and performance",
    story:
      "As an engineering lead, I want repeatable data generation and performance checks so that the test framework remains reliable as data volume grows.",
    requirementIds: ["REQ-SCALE-001", "REQ-PERF-001"],
    storyPoints: 3,
    priority: "Medium",
    sprint: 3
  }
];

const sprintPlan = [
  {
    sprint: 1,
    goal: "Establish requirements, chatbot KYC flow, NLP scope, and KYC synthetic data foundation.",
    storyIds: ["US-001", "US-002", "US-003"],
    plannedPoints: 18,
    monitoring:
      "Daily review of generated requirements, test data schema completeness, and open validation defects."
  },
  {
    sprint: 2,
    goal: "Add AML typology data, screening/risk logic, and escalation workflow coverage.",
    storyIds: ["US-004", "US-005", "US-006"],
    plannedPoints: 16,
    monitoring:
      "Track rule coverage by typology, review high-risk false positives, and confirm integration assumptions."
  },
  {
    sprint: 3,
    goal: "Complete RTM automation, reporting, performance checks, and release evidence.",
    storyIds: ["US-007", "US-008"],
    plannedPoints: 8,
    monitoring:
      "Review RTM gaps, stabilize Jest execution, and confirm all must-have requirements have passing coverage."
  }
];

const promptLog = [
  {
    id: "PROMPT-001",
    purpose: "Requirements generation",
    prompt:
      "Act as a banking compliance product owner. Generate requirements for an AI-assisted KYC and AML chatbot platform covering chatbot functionality, NLP, integrations, scalability, and performance.",
    outputSummary:
      "Produced requirement categories and acceptance criteria that became REQ-CHAT, REQ-NLP, REQ-INT, REQ-KYC, REQ-AML, REQ-SCALE, REQ-PERF, and REQ-REP."
  },
  {
    id: "PROMPT-002",
    purpose: "Synthetic KYC data design",
    prompt:
      "Create a JavaScript faker-based schema for synthetic KYC customers, including identity, address, employment, document verification, sanctions, PEP, and risk indicators.",
    outputSummary:
      "Defined the customer profile schema implemented by the KYC generator and covered by Jest tests."
  },
  {
    id: "PROMPT-003",
    purpose: "AML scenario design",
    prompt:
      "Generate AML testing scenarios for normal transactions, structuring, rapid movement of funds, high-risk geography, and sanctions exposure.",
    outputSummary:
      "Produced typology labels and rule expectations implemented by AML generator and detection tests."
  },
  {
    id: "PROMPT-004",
    purpose: "RTM and reporting",
    prompt:
      "Map compliance requirements to test cases and produce a Requirements Traceability Matrix with execution status and evidence notes.",
    outputSummary:
      "Created the RTM structure and Markdown report format generated by the reporting module."
  }
];

module.exports = {
  requirements,
  epics,
  userStories,
  sprintPlan,
  promptLog
};
