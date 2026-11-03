import { Alert, Button, Code, Loader, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import type { DbHealth } from '../api/client';
import { useDbHealth, useHealth } from '../api/hooks';

interface Props {
  /** Show the screen even when the database is missing (Import creates it). */
  allowMissingDatabase?: boolean;
  children: ReactNode;
}

type Reason = NonNullable<DbHealth['reason']>;

function reasonText(reason: Reason, env: string): { title: string; hint: ReactNode } {
  switch (reason) {
    case 'missing':
      return {
        title: 'Database not found',
        hint: 'Import a MoneyWell snapshot (development) or check SPEND_MANAGER_DB_PATH.',
      };
    case 'unreadable':
      return { title: "Database can't be read", hint: 'Check the file and the service log.' };
    case 'schema_outdated':
      return {
        title: 'Database schema is out of date',
        hint: (
          <>
            Run <Code>spend-manager-db migrate --env {env}</Code> in spend-manager-service.
          </>
        ),
      };
    case 'schema_newer':
      return {
        title: 'Database is newer than the service',
        hint: 'This service version is older than the database; update spend-manager-service.',
      };
  }
}

/** Checks the service and database before showing a screen (FR-S1, FR-S3). */
export function HealthGate({ allowMissingDatabase = false, children }: Props) {
  const health = useHealth();
  const db = useDbHealth();
  const retry = () => {
    void health.refetch();
    void db.refetch();
  };

  if (health.isPending || db.isPending) {
    return <Loader m="xl" aria-label="Checking the service" />;
  }

  if (health.isError || db.isError) {
    return (
      <Stack gap="sm" maw={640} data-testid="health-unreachable">
        <Title order={2}>Can&apos;t reach the Spend Manager service</Title>
        <Text>
          Start it in spend-manager-service with <Code>uv run uvicorn spend_manager.main:app</Code>{' '}
          (add <Code>SPEND_MANAGER_ENV=production</Code> for the production database), then retry.
        </Text>
        <div>
          <Button onClick={retry}>Retry</Button>
        </div>
      </Stack>
    );
  }

  const reason = db.data.reason;
  if (db.data.status === 'error' && reason) {
    const { title, hint } = reasonText(reason, db.data.env);
    if (reason === 'missing' && allowMissingDatabase) {
      return (
        <Stack gap="md">
          <Alert color="yellow" title="No database yet" data-testid="health-missing-notice">
            The first import creates the {db.data.env} database.
          </Alert>
          {children}
        </Stack>
      );
    }
    return (
      <Alert color="red" title={title} maw={640} data-testid="health-db-problem">
        <Text size="sm">{hint}</Text>
        <Button mt="sm" size="xs" variant="light" onClick={retry}>
          Retry
        </Button>
      </Alert>
    );
  }

  return <>{children}</>;
}
