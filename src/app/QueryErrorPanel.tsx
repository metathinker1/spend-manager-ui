import { Alert, Button, Group } from '@mantine/core';
import { ApiError } from '../api/client';
import { errorMessage } from './errorMessage';

interface Props {
  error: unknown;
  onRetry: () => void;
  onClearFilters?: () => void;
}

export function QueryErrorPanel({ error, onRetry, onClearFilters }: Props) {
  const invalidFilters = error instanceof ApiError && error.status === 422;
  return (
    <Alert color="red" title="Couldn't load data" data-testid="query-error">
      {errorMessage(error)}
      <Group mt="sm" gap="xs">
        {invalidFilters && onClearFilters ? (
          <Button size="xs" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <Button size="xs" variant="light" onClick={onRetry}>
            Retry
          </Button>
        )}
      </Group>
    </Alert>
  );
}
