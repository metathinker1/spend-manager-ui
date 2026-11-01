# spend-manager-ui

Browser UI for Spend Manager. It shows the transaction list and expense
reports, and starts imports from MoneyWell. All data comes from
[spend-manager-service](../spend-manager-service) (v0.3.0 or newer), which is
the only process that opens the Spend Manager database. This first release is
**read-only** apart from starting an import.

Built with AI-DLC. The requirements and design are in Google Drive under
`AI-DLC → spend-manager-ui → 2026-10-31-spend-manager-ui`.

## Screens

| Route               | Screen                                                                                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/transactions`     | Transaction list: one row per transaction, expandable splits, filters (period, accounts, categories incl. Uncategorized, show transfers, search), matching-line summary, paging, CSV export. Filters live in the URL, so any view can be bookmarked. |
| `/reports/spending` | Spending by category for a month or a year: table, bar chart, CSV.                                                                                                                                                                                   |
| `/reports/matrix`   | Category by month for a calendar year or the last 12 months: table, stacked chart, CSV.                                                                                                                                                              |
| `/import`           | Pick a MoneyWell snapshot, confirm (the dialog names the environment), see counts, warnings and backup status.                                                                                                                                       |

Every report value links to the transaction list filtered to exactly the lines
behind it. The list total equals the report value with the sign flipped: reports
show spending as a positive number, and the list shows signed amounts.

**Transfers:** lines in the category named `Transfer` are hidden in the list
unless "Show transfers" is on, and they are always left out of the reports.

## Requirements

- Node.js ≥ 22.12 and npm
- spend-manager-service running on `http://127.0.0.1:8000`

## Setup

```bash
npm ci
```

## Running (two processes)

```bash
# 1. the service (in spend-manager-service)
uv run uvicorn spend_manager.main:app                                  # development database
SPEND_MANAGER_ENV=production uv run uvicorn spend_manager.main:app     # production database

# 2. the UI (here)
npm run dev        # http://localhost:5173
```

The header shows which environment the service is using. The Vite dev server
listens on `localhost` only and forwards `/api`, `/health` and `/imports` to
the service, so the browser sees a single origin and the service needs no CORS.
To use another service address, set `SPEND_MANAGER_API_URL`, e.g.
`SPEND_MANAGER_API_URL=http://127.0.0.1:8001 npm run dev`.

## Scripts

| Script                               | Does                                                  |
| ------------------------------------ | ----------------------------------------------------- |
| `npm run dev`                        | Dev server with the API proxy                         |
| `npm run build`                      | Type check (`tsc -b`) + production build into `dist/` |
| `npm run preview`                    | Serve `dist/` with the same proxy (`localhost:4173`)  |
| `npm run lint`                       | ESLint, no warnings allowed                           |
| `npm run format` / `format:check`    | Prettier                                              |
| `npm test` / `npm run test:coverage` | Vitest (coverage must stay ≥ 80% of lines)            |
| `npm run generate:api`               | Regenerate the API types (see below)                  |

## API types

`src/api/schema.d.ts` is generated from the service's OpenAPI spec and
committed, so the UI builds without the service. Regenerate it whenever the
service API changes. A change that breaks the UI then shows up as a
compile error.

```bash
npm run generate:api                                         # from the running service
npm run generate:api -- --from-service ../spend-manager-service   # from the service code, no server
```

## Project layout

```text
src/
  api/        schema.d.ts (generated), client.ts, hooks.ts, queryKeys.ts, queryClient.ts
  app/        AppShell, HealthGate, NotFound, error panel and boundary, Providers
  features/
    transactions/  page, filters, period control, table, summary, pager, filterUrl.ts, period.ts
    reports/       spending and matrix pages, period controls, drillDown.ts, reportCsv.ts
    import/        page, snapshot list, confirmation dialog, result
  lib/        money.ts, csv.ts, dates.ts
  test/       setup, MSW handlers, synthetic fixtures, render helper
```

Stack: Vite, React, TypeScript (strict), Mantine (components and charts),
TanStack Query, React Router, openapi-fetch. Money is handled as integer cents
throughout; floating point is used only to display it.

## Testing

Tests sit next to the code (`*.test.ts(x)`) and run with Vitest, React Testing
Library and jsdom. HTTP is mocked at the network layer with MSW, using
synthetic data only (`src/test/fixtures.ts`), and a request with no mock fails
the test. No real financial data is in this repository.

## Out of scope (this release)

Editing transactions, bulk categorization, rules, tags, income reports, LAN
access or login, end-to-end browser tests.
