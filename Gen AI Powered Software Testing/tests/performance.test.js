const { performance } = require("node:perf_hooks");
const { generateKycCustomers, generateAmlScenarios, calculateKycRisk, evaluateAmlScenario } = require("../src");

describe("local synthetic generation and evaluation budget", () => {
  test("TC-PERF-001 processes 2000 customers and 5600 transactions within five seconds", () => {
    generateAmlScenarios(generateKycCustomers(10)); // Warm up local code; no external services.
    const start = performance.now();
    const customers = generateKycCustomers(2000);
    const transactions = generateAmlScenarios(customers);
    const risks = customers.map(calculateKycRisk);
    const alerts = evaluateAmlScenario(transactions);
    const elapsedMs = performance.now() - start;
    expect(customers).toHaveLength(2000);
    expect(transactions).toHaveLength(5600);
    expect(new Set(transactions.map((t) => t.transactionId)).size).toBe(5600);
    expect(risks.every((r, i) => r === customers[i].expectedRiskLevel)).toBe(true);
    expect(alerts.every((a, i) => a.alert === transactions[i].expectedAlert)).toBe(true);
    expect(elapsedMs).toBeLessThan(5000);
    console.info(`Local generation/evaluation: 2000 customers, 5600 transactions, ${elapsedMs.toFixed(1)} ms; budget 5000 ms.`);
  }, 10000);
});
