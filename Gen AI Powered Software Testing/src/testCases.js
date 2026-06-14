const testCases = [
  {
    id: "TC-KYC-001",
    title: "KYC generator creates complete synthetic customer profiles",
    type: "Data Quality",
    requirementIds: ["REQ-KYC-001", "REQ-SCALE-001"],
    steps: [
      "Generate a seeded KYC customer dataset.",
      "Validate required identity, address, employment, document, and screening fields.",
      "Confirm customer and document identifiers are unique."
    ],
    expectedResult: "All generated customers contain required synthetic KYC fields and unique identifiers.",
    automated: true,
    jestFile: "tests/kyc.test.js"
  },
  {
    id: "TC-KYC-002",
    title: "KYC risk engine flags high-risk and sanctions customers",
    type: "Risk Validation",
    requirementIds: ["REQ-KYC-001", "REQ-INT-002"],
    steps: [
      "Generate customers across low, medium, and high expected risk.",
      "Calculate KYC risk using screening, geography, income, and document signals.",
      "Confirm sanctions matches require manual review."
    ],
    expectedResult: "High-risk and sanctions-positive customers are identified for compliance review.",
    automated: true,
    jestFile: "tests/kyc.test.js"
  },
  {
    id: "TC-AML-001",
    title: "AML generator covers required suspicious typologies",
    type: "Scenario Coverage",
    requirementIds: ["REQ-AML-001"],
    steps: [
      "Generate AML transactions from synthetic customers.",
      "Group scenarios by typology label.",
      "Confirm normal activity and suspicious AML typologies are present."
    ],
    expectedResult: "Generated data includes normal activity, structuring, rapid movement, high-risk geography, and sanctions exposure.",
    automated: true,
    jestFile: "tests/aml.test.js"
  },
  {
    id: "TC-AML-002",
    title: "AML rules raise alerts for suspicious activity",
    type: "Risk Validation",
    requirementIds: ["REQ-AML-001", "REQ-INT-002"],
    steps: [
      "Evaluate generated AML transactions with the detection rules.",
      "Compare alert results with expected scenario labels.",
      "Confirm alert reasons identify the triggering behavior."
    ],
    expectedResult: "Suspicious transactions raise alerts with traceable reasons.",
    automated: true,
    jestFile: "tests/aml.test.js"
  },
  {
    id: "TC-REQ-001",
    title: "Requirements cover chatbot, NLP, integration, scale, performance, KYC, AML, and reporting",
    type: "Requirements Review",
    requirementIds: [
      "REQ-CHAT-001",
      "REQ-CHAT-002",
      "REQ-NLP-001",
      "REQ-NLP-002",
      "REQ-INT-001",
      "REQ-INT-002",
      "REQ-KYC-001",
      "REQ-AML-001",
      "REQ-SCALE-001",
      "REQ-PERF-001",
      "REQ-REP-001"
    ],
    steps: [
      "Inspect the generated requirements catalog.",
      "Confirm all assignment-required categories are present.",
      "Confirm each requirement includes acceptance criteria."
    ],
    expectedResult: "The requirements catalog is complete and testable.",
    automated: true,
    jestFile: "tests/requirements.test.js"
  },
  {
    id: "TC-REP-001",
    title: "RTM maps test cases to requirements and execution evidence",
    type: "Reporting",
    requirementIds: ["REQ-REP-001"],
    steps: [
      "Generate the RTM from requirements and test case definitions.",
      "Validate every test case maps to a requirement.",
      "Validate every must-have requirement has automated coverage."
    ],
    expectedResult: "The RTM provides complete traceability from requirements to automated test evidence.",
    automated: true,
    jestFile: "tests/reporting.test.js"
  },
  {
    id: "TC-PERF-001",
    title: "Synthetic data generation meets local performance threshold",
    type: "Performance",
    requirementIds: ["REQ-PERF-001", "REQ-SCALE-001"],
    steps: [
      "Generate a larger KYC dataset.",
      "Generate AML transactions from the dataset.",
      "Measure elapsed execution time."
    ],
    expectedResult: "Data generation completes within the documented local test threshold.",
    automated: true,
    jestFile: "tests/performance.test.js"
  }
];

module.exports = {
  testCases
};
