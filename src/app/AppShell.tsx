import { AppShell, Badge, Group, Loader, Text, UnstyledButton } from '@mantine/core';
import { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useHealth } from '../api/hooks';
import classes from './AppShell.module.css';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const NAV = [
  { to: '/transactions', label: 'Transactions' },
  { to: '/reports/spending', label: 'Spending' },
  { to: '/reports/matrix', label: 'By month' },
  { to: '/import', label: 'Import' },
];

export function EnvBadge() {
  const env = useHealth().data?.env;
  if (!env) return null;
  return (
    <Badge color={env === 'production' ? 'red' : 'blue'} variant="filled" data-testid="env-badge">
      {env}
    </Badge>
  );
}

export function AppLayout() {
  const location = useLocation();
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Text fw={700} size="lg">
              Spend Manager
            </Text>
            <EnvBadge />
          </Group>
          <Group component="nav" aria-label="Main" gap={4} wrap="nowrap">
            {NAV.map((item) => (
              <UnstyledButton
                key={item.to}
                component={NavLink}
                to={item.to}
                className={classes.link}
              >
                {item.label}
              </UnstyledButton>
            ))}
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <RouteErrorBoundary key={location.pathname}>
          <Suspense fallback={<Loader m="xl" aria-label="Loading" />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </AppShell.Main>
    </AppShell>
  );
}
