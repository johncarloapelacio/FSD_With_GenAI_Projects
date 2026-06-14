const { faker } = require("@faker-js/faker");

const RISK_LEVELS = ["low", "medium", "high"];
const DOCUMENT_TYPES = ["passport", "drivers_license", "national_id"];
const EMPLOYMENT_STATUSES = ["employed", "self_employed", "student", "retired", "unemployed"];

function createKycCustomer(index = 0) {
  const riskLevel = RISK_LEVELS[index % RISK_LEVELS.length];
  const country = riskLevel === "high" ? faker.helpers.arrayElement(["IR", "KP", "RU"]) : faker.location.countryCode();
  const isPep = riskLevel === "high" || (riskLevel === "medium" && index % 2 === 0);
  const sanctionsMatch = riskLevel === "high" && index % 3 === 2;

  return {
    customerId: `CUST-${String(index + 1).padStart(5, "0")}`,
    legalName: faker.person.fullName(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 85, mode: "age" }).toISOString().slice(0, 10),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number({ style: "international" }),
    address: {
      line1: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      postalCode: faker.location.zipCode(),
      country
    },
    employment: {
      status: faker.helpers.arrayElement(EMPLOYMENT_STATUSES),
      occupation: faker.person.jobTitle(),
      employer: faker.company.name(),
      annualIncomeUsd: faker.number.int({ min: 18000, max: 450000 }),
      sourceOfFunds: faker.helpers.arrayElement(["salary", "business_income", "investment_income", "inheritance"])
    },
    document: {
      type: faker.helpers.arrayElement(DOCUMENT_TYPES),
      documentId: `DOC-${faker.string.alphanumeric({ length: 10, casing: "upper" })}`,
      issuingCountry: country,
      verified: riskLevel !== "high" || index % 2 === 1,
      expiresOn: faker.date.future({ years: 8 }).toISOString().slice(0, 10)
    },
    screening: {
      isPep,
      sanctionsMatch,
      adverseMedia: riskLevel === "high" || (riskLevel === "medium" && index % 3 === 1)
    },
    expectedRiskLevel: riskLevel,
    createdAt: faker.date.recent({ days: 30 }).toISOString()
  };
}

function generateKycCustomers(count = 30, seed = 20260613) {
  faker.seed(seed);
  return Array.from({ length: count }, (_, index) => createKycCustomer(index));
}

module.exports = {
  generateKycCustomers,
  createKycCustomer
};
