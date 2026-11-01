import { ApiError } from '../api/client';

/** User-facing text for a failed request (Functional Design §3.11). */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong.';
  if (error.status === 0) return "Can't reach the Spend Manager service.";
  if (error.status === 422) return "These filters aren't valid.";
  if (error.status >= 500) return 'The service had an error — see its log.';
  return error.detail;
}
