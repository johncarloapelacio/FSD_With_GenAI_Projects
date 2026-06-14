const HIGH_RISK_COUNTRIES = new Set(["IR", "KP", "RU", "SY"]);

function evaluateTransaction(transaction) {
  const reasons = [];

  if (transaction.channel === "cash_deposit" && transaction.amountUsd >= 9000 && transaction.amountUsd < 10000) {
    reasons.push("possible_structuring");
  }

  if (transaction.channel === "wire" && transaction.amountUsd >= 15000) {
    reasons.push("rapid_funds_movement");
  }

  if (HIGH_RISK_COUNTRIES.has(transaction.counterpartyCountry)) {
    reasons.push("high_risk_geography");
  }

  if (/watchlist|sanction/i.test(transaction.counterparty)) {
    reasons.push("sanctions_exposure");
  }

  return {
    transactionId: transaction.transactionId,
    alert: reasons.length > 0,
    reasons,
    severity: reasons.includes("sanctions_exposure") ? "critical" : reasons.length > 1 ? "high" : reasons.length === 1 ? "medium" : "low"
  };
}

function evaluateAmlScenario(transactions) {
  return transactions.map(evaluateTransaction);
}

module.exports = {
  HIGH_RISK_COUNTRIES,
  evaluateTransaction,
  evaluateAmlScenario
};
