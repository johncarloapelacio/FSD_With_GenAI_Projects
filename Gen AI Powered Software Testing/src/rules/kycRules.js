const HIGH_RISK_COUNTRIES = new Set(["IR", "KP", "RU", "SY"]);

function hasCompleteKycProfile(customer) {
  if (!customer || typeof customer !== "object") return false;
  const requiredText = [customer.customerId, customer.legalName, customer.email, customer.phone,
    customer.address?.line1, customer.address?.city, customer.address?.country,
    customer.employment?.status, customer.employment?.sourceOfFunds,
    customer.document?.documentId, customer.document?.type];
  if (requiredText.some((value) => typeof value !== "string" || !value.trim())) return false;
  if (!/^\S+@\S+\.\S+$/.test(customer.email)) return false;
  if (typeof customer.dateOfBirth !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(customer.dateOfBirth)) return false;
  const birthday = new Date(`${customer.dateOfBirth}T00:00:00Z`);
  if (!Number.isFinite(birthday.getTime()) || birthday.toISOString().slice(0, 10) !== customer.dateOfBirth) return false;
  if (![customer.screening?.isPep, customer.screening?.sanctionsMatch, customer.screening?.adverseMedia, customer.document?.verified]
    .every((value) => typeof value === "boolean")) return false;
  if (!Number.isFinite(customer.employment?.annualIncomeUsd) || customer.employment.annualIncomeUsd < 0) return false;
  return true;
}

function calculateKycRisk(customer) {
  if (!customer || typeof customer !== "object") throw new TypeError("customer must be an object");
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
  return !hasCompleteKycProfile(customer) || customer.document.verified !== true || calculateKycRisk(customer) === "high" || customer.screening?.sanctionsMatch === true;
}

module.exports = {
  HIGH_RISK_COUNTRIES,
  hasCompleteKycProfile,
  calculateKycRisk,
  requiresManualReview
};
