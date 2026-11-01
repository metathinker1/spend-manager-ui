import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { createQueryClient } from '../api/queryClient';
import { Providers } from '../app/Providers';

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

/** Render with Mantine (test mode), a fresh query client (no retries) and a router at `route`. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = createQueryClient({ retry: false });
  const user = userEvent.setup();
  const utils = render(
    <Providers client={queryClient} env="test">
      <MemoryRouter initialEntries={[route]}>
        {ui}
        <LocationDisplay />
      </MemoryRouter>
    </Providers>,
  );
  return { ...utils, user, queryClient };
}

/** The router's current path and query string. */
export function currentLocation(): string {
  return screen.getByTestId('location').textContent ?? '';
}

/** The query string of the current location as URLSearchParams. */
export function currentSearch(): URLSearchParams {
  return new URLSearchParams(currentLocation().split('?')[1] ?? '');
}
