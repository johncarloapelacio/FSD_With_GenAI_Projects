const { generateKycCustomers, generateAmlScenarios } = require("../src");

describe("synthetic data generation performance", () => {
  test("TC-PERF-001 generates larger datasets within local threshold", () => {
    const start = Date.now();
    const customers = generateKycCustomers(250);
    const transactions = generateAmlScenarios(customers);
    const elapsedMs = Date.now() - start;

    expect(customers).toHaveLength(250);
    expect(transactions.length).toBeGreaterThan(250);
    expect(elapsedMs).toBeLessThan(2000);
  });
});
