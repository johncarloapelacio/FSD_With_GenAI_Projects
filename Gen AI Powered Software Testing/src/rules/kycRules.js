const HIGH_RISK_COUNTRIES = new Set(["IR", "KP", "RU", "SY"]);

function hasCompleteKycProfile(customer) {
  return Boolean(
    customer.customerId &&
      customer.legalName &&
      customer.dateOfBirth &&
      customer.email &&
      customer.phone &&
      customer.address?.line1 &&
      customer.address?.city &&
      customer.address?.country &&
      customer.employment?.status &&
      customer.employment?.sourceOfFunds &&
      customer.document?.documentId &&
      customer.document?.type
  );
}

function calculateKycRisk(customer) {
  let score = 0;

  if (HIGH_RISK_COUNTRIES.has(customer.address?.country)) score += 35;
  if (HIGH_RISK_COUNTRIES.has(customer.document?.issuingCountry)) score += 20;
  if (customer.screening?.isPep) score += 20;
  if (customer.screening?.sanctionsMatch) score += 45;
  if (customer.screening?.adverseMedia) score += 15;
  if (!customer.document?.verified) score += 20;
  if ((customer.employment?.annualIncomeUsd || 0) > 250000) score += 10;

  if (score >= 60) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function requiresManualReview(customer) {
  return calculateKycRisk(customer) === "high" || customer.screening?.sanctionsMatch === true;
}

module.exports = {
  HIGH_RISK_COUNTRIES,
  hasCompleteKycProfile,
  calculateKycRisk,
  requiresManualReview
};
