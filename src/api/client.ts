// Typed HTTP client for spend-manager-service (NFR Design §3.2).
// Types come from the generated OpenAPI schema; run `npm run generate:api`
// after the service API changes.
import createClient from 'openapi-fetch';
import type { components, paths } from './schema';

type Schemas = components['schemas'];
export type Account = Schemas['Account'];
export type Category = Schemas['Category'];
export type TransactionPage = Schemas['TransactionPage'];
export type TransactionRow = Schemas['TransactionRow'];
export type SplitRow = Schemas['SplitRow'];
export type Period = Schemas['Period'];
export type SpendingByCategoryReport = Schemas['SpendingByCategoryReport'];
export type CategoryByMonthReport = Schemas['CategoryByMonthReport'];
export type Snapshot = Schemas['Snapshot'];
export type Health = Schemas['HealthResponse'];
export type DbHealth = Schemas['DatabaseHealthResponse'];
export type ImportResponse = Schemas['MoneyWellStoreImportResponse'];

/** A failed request: `status` 0 means the service could not be reached. */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(status ? `${status}: ${detail}` : detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export const UNREACHABLE = "Can't reach the Spend Manager service";

export const api = createClient<paths>({
  baseUrl: window.location.origin,
  // Look up fetch on every call (not once at import) so it can be replaced,
  // e.g. by the mock server in tests.
  fetch: (request) => globalThis.fetch(request),
});

type ApiResult<T> = { data?: T; error?: unknown; response: Response };

/** Resolve to the response body, or reject with an `ApiError`. */
export async function unwrap<T>(request: Promise<ApiResult<T>>): Promise<T> {
  let result: ApiResult<T>;
  try {
    result = await request;
  } catch {
    throw new ApiError(0, UNREACHABLE);
  }
  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(result.response.status, errorDetail(result.error, result.response));
  }
  return result.data as T;
}

/** The service's `{detail}` text, or the messages of a 422 validation body. */
export function errorDetail(body: unknown, response: Response): string {
  const detail = (body as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item as { msg?: unknown }).msg)
      .filter((msg): msg is string => typeof msg === 'string');
    if (messages.length) return messages.join('; ');
  }
  return response.statusText || `HTTP ${response.status}`;
}
