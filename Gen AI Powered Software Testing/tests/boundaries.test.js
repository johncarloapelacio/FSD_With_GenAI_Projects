const { generateKycCustomers, generateAmlScenarios, hasCompleteKycProfile, requiresManualReview, evaluateTransaction, evaluateAmlScenario } = require("../src");

test("TC-KYC-001 generation is repeatable across wall clocks and seeds are isolated from AML generation", () => {
  const expected = generateKycCustomers(50, 1);
  const oldNow = Date.now;
  Date.now = () => 2100000000000;
  try {
    generateAmlScenarios(expected, 99);
    expect(generateKycCustomers(50, 1)).toEqual(expected);
    expect(generateKycCustomers(50, 2)).not.toEqual(expected);
  } finally { Date.now = oldNow; }
  expect(expected.every((c) => c.email.endsWith("@example.test"))).toBe(true);
});

test.each([-1, 1.2, "30", NaN, 100001])("TC-KYC-001 rejects invalid count %s", (count) => expect(() => generateKycCustomers(count)).toThrow(RangeError));
test("TC-KYC-001 supports an empty dataset", () => expect(generateAmlScenarios(generateKycCustomers(0))).toEqual([]));
test("TC-KYC-002 incomplete and malformed profiles require manual review", () => {
  for (const value of [null, {}, { ...generateKycCustomers(1)[0], legalName: " " }, { ...generateKycCustomers(1)[0], dateOfBirth: "2026-02-30" }, { ...generateKycCustomers(1)[0], screening: {} }]) {
    expect(hasCompleteKycProfile(value)).toBe(false);
    expect(requiresManualReview(value)).toBe(true);
  }
});

test("TC-AML-001 generation is repeatable and rejects duplicate customers", () => {
  const customers = generateKycCustomers(50);
  const transactions = generateAmlScenarios(customers);
  expect(generateAmlScenarios(customers)).toEqual(transactions);
  expect(new Set(transactions.map((t) => t.transactionId)).size).toBe(transactions.length);
  expect(() => generateAmlScenarios([customers[0], customers[0]])).toThrow(TypeError);
});

const clean = { transactionId: "T1", customerId: "C1", channel: "cash_deposit", amountUsd: 9000, currency: "USD", counterparty: "Trusted company", counterpartyCountry: "US" };
test.each([[8999.99, false], [9000, true], [9999.99, true], [10000, false]])("TC-AML-002 structuring amount boundary %s", (amountUsd, expected) => {
  expect(evaluateTransaction({ ...clean, amountUsd }).reasons.includes("possible_structuring")).toBe(expected);
});
test.each([[14999.99, false], [15000, true]])("TC-AML-002 wire proxy amount boundary %s", (amountUsd, expected) => {
  expect(evaluateTransaction({ ...clean, channel: "wire", amountUsd }).reasons.includes("rapid_funds_movement")).toBe(expected);
});
test.each([-1, 0, NaN, Infinity, "9000"])("TC-AML-002 malformed amount fails rather than silently clears %s", (amountUsd) => expect(() => evaluateTransaction({ ...clean, amountUsd })).toThrow(TypeError));
test("TC-AML-002 combined signals retain all reasons and severity", () => {
  const result = evaluateTransaction({ ...clean, counterpartyCountry: "IR" });
  expect(result.reasons).toEqual(["possible_structuring", "high_risk_geography"]);
  expect(result.severity).toBe("high");
  expect(evaluateAmlScenario([clean])).toHaveLength(1);
  expect(() => evaluateAmlScenario([clean, clean])).toThrow(TypeError);
  expect(() => evaluateTransaction({ ...clean, currency: "EUR" })).toThrow(TypeError);
});


test("TC-KYC-002 an unverified identity document requires review even at low overall risk", () => {
  const customer = generateKycCustomers(1)[0];
  customer.document.verified = false;
  expect(requiresManualReview(customer)).toBe(true);
});
