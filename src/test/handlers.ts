import { http, HttpResponse } from 'msw';
import {
  accounts,
  categories,
  importResponse,
  matrixLast12,
  snapshots,
  spendingYear,
  transactionPage,
} from './fixtures';

// `*/` matches any origin (the client uses window.location.origin).
export const handlers = [
  http.get('*/health', () => HttpResponse.json({ status: 'ok', env: 'development' })),
  http.get('*/health/db', () =>
    HttpResponse.json({
      status: 'ok',
      env: 'development',
      database: 'spend_manager.db',
      schema_version: 2,
      required_schema_version: 2,
      last_backup_at: null,
      last_backup_file: null,
      reason: null,
    }),
  ),
  http.get('*/api/accounts', () => HttpResponse.json(accounts)),
  http.get('*/api/categories', () => HttpResponse.json(categories)),
  http.get('*/api/transactions', () => HttpResponse.json(transactionPage())),
  http.get('*/api/reports/spending-by-category', () => HttpResponse.json(spendingYear)),
  http.get('*/api/reports/category-by-month', () => HttpResponse.json(matrixLast12)),
  http.get('*/api/moneywell-snapshots', () => HttpResponse.json(snapshots)),
  http.post('*/imports/moneywell-store', () => HttpResponse.json(importResponse, { status: 201 })),
];

/** A database-health response with a problem (HTTP 503). */
export function dbProblem(reason: 'missing' | 'unreadable' | 'schema_outdated' | 'schema_newer') {
  return http.get('*/health/db', () =>
    HttpResponse.json(
      {
        status: 'error',
        env: 'development',
        database: 'spend_manager.db',
        schema_version: null,
        required_schema_version: 2,
        last_backup_at: null,
        last_backup_file: null,
        reason,
      },
      { status: 503 },
    ),
  );
}

/** Record the URLs requested from `path` while answering with the default handler's body. */
export function recordRequests(path: string, body: () => unknown) {
  const urls: URL[] = [];
  const handler = http.get(`*${path}`, ({ request }) => {
    urls.push(new URL(request.url));
    return HttpResponse.json(body() as object);
  });
  return { handler, urls };
}
