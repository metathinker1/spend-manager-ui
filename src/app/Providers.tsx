import { MantineProvider } from '@mantine/core';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { theme } from '../theme';

interface Props {
  client: QueryClient;
  /** `test` turns off Mantine transitions and portals for tests. */
  env?: 'default' | 'test';
  children: ReactNode;
}

export function Providers({ client, env = 'default', children }: Props) {
  return (
    <MantineProvider theme={theme} env={env} defaultColorScheme="auto">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MantineProvider>
  );
}
