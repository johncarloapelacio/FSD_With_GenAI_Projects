const { faker } = require("@faker-js/faker");

const TYPOLOGIES = [
  "normal_activity",
  "structuring",
  "rapid_movement",
  "high_risk_geography",
  "sanctions_exposure"
];

function createTransaction(customerId, sequence, typology) {
  const base = {
    transactionId: `TXN-${customerId}-${String(sequence).padStart(3, "0")}`,
    customerId,
    timestamp: faker.date.recent({ days: 14 }).toISOString(),
    currency: "USD",
    channel: faker.helpers.arrayElement(["ach", "card"]),
    counterparty: `Trusted ${faker.company.name()}`,
    counterpartyCountry: faker.helpers.arrayElement(["US", "CA", "GB", "FR", "DE", "AU", "JP"]),
    amountUsd: faker.number.int({ min: 35, max: 8500 }),
    typology,
    expectedAlert: false
  };

  if (typology === "structuring") {
    return {
      ...base,
      channel: "cash_deposit",
      amountUsd: faker.number.int({ min: 9000, max: 9999 }),
      expectedAlert: true
    };
  }

  if (typology === "rapid_movement") {
    return {
      ...base,
      channel: "wire",
      amountUsd: faker.number.int({ min: 15000, max: 85000 }),
      expectedAlert: true
    };
  }

  if (typology === "high_risk_geography") {
    return {
      ...base,
      channel: "international_transfer",
      counterpartyCountry: faker.helpers.arrayElement(["IR", "KP", "SY", "RU"]),
      amountUsd: faker.number.int({ min: 2500, max: 25000 }),
      expectedAlert: true
    };
  }

  if (typology === "sanctions_exposure") {
    return {
      ...base,
      counterparty: `${faker.company.name()} Watchlist Holdings`,
      counterpartyCountry: faker.helpers.arrayElement(["IR", "KP"]),
      amountUsd: faker.number.int({ min: 1000, max: 50000 }),
      expectedAlert: true
    };
  }

  return base;
}

function generateAmlScenarios(customers, seed = 20260614) {
  faker.seed(seed);
  return customers.flatMap((customer, index) => {
    const typology = TYPOLOGIES[index % TYPOLOGIES.length];
    const transactionCount = typology === "structuring" || typology === "rapid_movement" ? 4 : 2;

    return Array.from({ length: transactionCount }, (_, txIndex) =>
      createTransaction(customer.customerId, txIndex + 1, typology)
    );
  });
}

module.exports = {
  TYPOLOGIES,
  generateAmlScenarios,
  createTransaction
};
