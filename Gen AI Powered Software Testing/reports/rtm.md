# Requirements Traceability Matrix

Mapping a requirement does not verify its acceptance criteria. Catalog review checks documentation only.

| Requirement | Category | Scope | Test Cases |
| --- | --- | --- | --- |
| REQ-CHAT-001: Guided KYC onboarding conversation | Chatbot Functionality | Catalog review only | TC-REQ-001 (Passed; Catalog review) |
| REQ-CHAT-002: Case status and escalation support | Chatbot Functionality | Catalog review only | TC-REQ-001 (Passed; Catalog review) |
| REQ-NLP-001: Intent recognition for banking compliance journeys | NLP Capabilities | Catalog review only | TC-REQ-001 (Passed; Catalog review) |
| REQ-NLP-002: Entity extraction for KYC and AML fields | NLP Capabilities | Catalog review only | TC-REQ-001 (Passed; Catalog review) |
| REQ-INT-001: Core banking and CRM integration | Integration | Catalog review only | TC-REQ-001 (Passed; Catalog review) |
| REQ-INT-002: Identity verification and sanctions screening integration | Integration | Partial: simulated signals only | TC-KYC-002 (Passed; Local implementation check)<br>TC-AML-002 (Passed; Local implementation check)<br>TC-REQ-001 (Passed; Catalog review) |
| REQ-KYC-001: Complete synthetic KYC customer profiles | KYC Data | Local implementation checks | TC-KYC-001 (Passed; Local implementation check)<br>TC-KYC-002 (Passed; Local implementation check)<br>TC-REQ-001 (Passed; Catalog review) |
| REQ-AML-001: Synthetic AML transaction scenarios | AML Monitoring | Local implementation checks | TC-AML-001 (Passed; Local implementation check)<br>TC-AML-002 (Passed; Local implementation check)<br>TC-REQ-001 (Passed; Catalog review) |
| REQ-SCALE-001: Scalable test data generation | Scalability | Local implementation checks | TC-KYC-001 (Passed; Local implementation check)<br>TC-REQ-001 (Passed; Catalog review)<br>TC-PERF-001 (Passed; Local implementation check) |
| REQ-PERF-001: Performance expectations for compliance workflows | Performance | Local implementation checks | TC-REQ-001 (Passed; Catalog review)<br>TC-PERF-001 (Passed; Local implementation check) |
| REQ-REP-001: RTM and test report generation | Reporting | Local implementation checks | TC-REQ-001 (Passed; Catalog review)<br>TC-REP-001 (Passed; Local implementation check) |
