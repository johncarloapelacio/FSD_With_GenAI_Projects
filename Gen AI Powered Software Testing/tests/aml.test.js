const { generateKycCustomers, generateAmlScenarios, TYPOLOGIES, evaluateTransaction } = require("../src");

describe("AML synthetic scenarios and detection rules", () => {
  test("TC-AML-001 covers required AML typologies", () => {
    const customers = generateKycCustomers(30);
    const transactions = generateAmlScenarios(customers);
    const typologies = new Set(transactions.map((transaction) => transaction.typology));

    TYPOLOGIES.forEach((typology) => expect(typologies.has(typology)).toBe(true));
  });

  test("TC-AML-002 raises alerts for suspicious transactions and not normal activity", () => {
    const customers = generateKycCustomers(30);
    const transactions = generateAmlScenarios(customers);

    for (const transaction of transactions) {
      const result = evaluateTransaction(transaction);
      expect(result.alert).toBe(transaction.expectedAlert);
      if (transaction.expectedAlert) {
        expect(result.reasons.length).toBeGreaterThan(0);
      }
    }
  });

  test("sanctions exposure has critical severity", () => {
    const customers = generateKycCustomers(10);
    const transactions = generateAmlScenarios(customers);
    const sanctionsTransaction = transactions.find((transaction) => transaction.typology === "sanctions_exposure");

    expect(sanctionsTransaction).toBeDefined();
    expect(evaluateTransaction(sanctionsTransaction).severity).toBe("critical");
  });
});
