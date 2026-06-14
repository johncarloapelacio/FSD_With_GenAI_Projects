const {
  generateKycCustomers,
  hasCompleteKycProfile,
  calculateKycRisk,
  requiresManualReview
} = require("../src");

describe("KYC synthetic data and risk rules", () => {
  test("TC-KYC-001 generates complete profiles with unique customer and document IDs", () => {
    const customers = generateKycCustomers(30);
    const customerIds = new Set(customers.map((customer) => customer.customerId));
    const documentIds = new Set(customers.map((customer) => customer.document.documentId));

    expect(customers).toHaveLength(30);
    expect(customerIds.size).toBe(30);
    expect(documentIds.size).toBe(30);
    customers.forEach((customer) => expect(hasCompleteKycProfile(customer)).toBe(true));
  });

  test("TC-KYC-002 includes low, medium, and high-risk KYC examples", () => {
    const customers = generateKycCustomers(30);
    const expectedRiskLevels = new Set(customers.map((customer) => customer.expectedRiskLevel));

    expect(expectedRiskLevels).toEqual(new Set(["low", "medium", "high"]));
    expect(customers.some((customer) => calculateKycRisk(customer) === "high")).toBe(true);
    expect(customers.some((customer) => calculateKycRisk(customer) === "medium")).toBe(true);
    expect(customers.some((customer) => calculateKycRisk(customer) === "low")).toBe(true);
  });

  test("sanctions-positive customers require manual review", () => {
    const customers = generateKycCustomers(30);
    const sanctionsMatches = customers.filter((customer) => customer.screening.sanctionsMatch);

    expect(sanctionsMatches.length).toBeGreaterThan(0);
    sanctionsMatches.forEach((customer) => expect(requiresManualReview(customer)).toBe(true));
  });
});
