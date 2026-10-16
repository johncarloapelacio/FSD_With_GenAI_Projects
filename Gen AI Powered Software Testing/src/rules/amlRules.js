const HIGH_RISK_COUNTRIES = new Set(["IR", "KP", "RU", "SY"]);

function evaluateTransaction(transaction) {
  if (!transaction || typeof transaction !== "object" ||
      !Number.isFinite(transaction.amountUsd) || transaction.amountUsd <= 0 ||
      transaction.currency !== "USD" ||
      [transaction.transactionId, transaction.customerId, transaction.counterparty, transaction.counterpartyCountry, transaction.channel]
        .some((value) => typeof value !== "string" || !value.trim())) {
    throw new TypeError("transaction must have identifiers, positive finite USD amount, channel and counterparty fields");
  }
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
  if (!Array.isArray(transactions) || new Set(transactions.map((t) => t?.transactionId)).size !== transactions.length) {
    throw new TypeError("transactions must be an array with unique transaction IDs");
  }
  return transactions.map(evaluateTransaction);
}

module.exports = {
  HIGH_RISK_COUNTRIES,
  evaluateTransaction,
  evaluateAmlScenario
};
