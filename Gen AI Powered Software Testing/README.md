# GenAI Assisted Software Testing

A JavaScript/Jest portfolio framework for synthetic KYC and AML test data, illustrative local risk rules, requirement planning, traceability, and observed test reporting. `problem_statement.txt` contains the assignment. No banking service, chatbot, NLP model, identity provider, or live screening integration is implemented. Those areas remain planned requirements in the catalog.

## Run

Use Node.js **24.9 or newer**. Jest uses Node's experimental VM-module support to load the ESM Faker dependency; the corresponding Node warning is expected.

```sh
npm ci
npm test
npm run test:coverage
```

`npm test` runs Jest and then builds reports from that exact run. Failed assertions or suite initialization failures remain failed in the reports and return a nonzero exit status. Skipped and unexecuted catalog cases do not count as passed. `npm run generate` only rebuilds data and documents: it resets execution evidence to **Not Run** and never carries forward an older pass. To restore observed evidence, run `npm test` again. Source-code coverage comes from `npm run test:coverage` under `coverage/`; RTM mapping is a separate measure.

## Evidence and scope

- `reports/test-report.md`: observed run totals and explicit scope limits.
- `reports/execution-summary.json`: run totals and artifact-generation timing.
- `reports/rtm.json` and `.md`: catalog mappings, local checks, partial simulated signals, and catalog-only review. A catalog review does not verify a platform's acceptance criteria.
- `data/generated/`: synthetic customers, transactions, and catalog cases.
- `docs/`: requirements, Agile planning, GenAI process notes, and a visual overview.

The performance case generates and evaluates 2,000 customers / 5,600 transactions against a five-second **local** budget. It verifies IDs and expected risk/alert outputs alongside timing; it says nothing about network latency or banking production capacity. Generators have independent Faker instances, fixed reference dates, configurable counts and seeds, and reserved `example.test` email addresses. KYC expected risk labels are checked against actual calculated labels. Boundary tests include malformed inputs and amount thresholds; reporting tests cover missing, failing, skipped, and unrelated evidence.

Risk thresholds, country lists, string-based watchlist markers, and large-wire proxies are simplified teaching rules. They are not legal/compliance guidance, actual sanctions screening, proof of rapid fund movement, or a production AML model. Generated data must never be used to contact people or screen real accounts.

A dependency override updates the YAML reader used by Istanbul's configuration loader from vulnerable v3 to v4; its `load()` API is compatible for the JSON/YAML configuration used here. The full coverage command exercises this path. Do not blindly apply audit force downgrades that replace Jest with older major versions.
