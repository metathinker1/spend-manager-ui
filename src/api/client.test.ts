import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { api, ApiError, errorDetail, unwrap } from './client';
import { shouldRetry } from './queryClient';

describe('unwrap', () => {
  it('returns the body', async () => {
    await expect(unwrap(api.GET('/api/accounts'))).resolves.toHaveLength(3);
  });

  it('turns {detail} into an ApiError', async () => {
    server.use(
      http.get('*/api/moneywell-snapshots', () =>
        HttpResponse.json({ detail: 'MoneyWell store root directory not found' }, { status: 404 }),
      ),
    );
    await expect(unwrap(api.GET('/api/moneywell-snapshots'))).rejects.toMatchObject({
      status: 404,
      detail: 'MoneyWell store root directory not found',
    });
  });

  it('joins 422 validation messages', async () => {
    server.use(
      http.get('*/api/transactions', () =>
        HttpResponse.json(
          { detail: [{ msg: 'bad date' }, { msg: 'bad page' }, { other: 1 }] },
          { status: 422 },
        ),
      ),
    );
    await expect(unwrap(api.GET('/api/transactions'))).rejects.toMatchObject({
      status: 422,
      detail: 'bad date; bad page',
    });
  });

  it('reports an unreachable service as status 0', async () => {
    server.use(http.get('*/api/accounts', () => HttpResponse.error()));
    const error = await unwrap(api.GET('/api/accounts')).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, message: "Can't reach the Spend Manager service" });
  });

  it('falls back to the status text', () => {
    expect(errorDetail(undefined, new Response(null, { status: 500, statusText: 'Oops' }))).toBe(
      'Oops',
    );
    expect(errorDetail('text', new Response(null, { status: 502 }))).toBe('HTTP 502');
  });
});

describe('shouldRetry', () => {
  it('retries once for network errors and 5xx, never for 4xx', () => {
    expect(shouldRetry(0, new ApiError(0, 'x'))).toBe(true);
    expect(shouldRetry(0, new ApiError(500, 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError(500, 'x'))).toBe(false);
    expect(shouldRetry(0, new ApiError(422, 'x'))).toBe(false);
    expect(shouldRetry(0, new Error('x'))).toBe(true);
  });
});
