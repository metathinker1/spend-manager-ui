import { Alert, List, Stack, Table, Text, Title } from '@mantine/core';
import type { ImportResponse } from '../../api/client';
import { errorMessage } from '../../app/errorMessage';
import { ApiError } from '../../api/client';

const ENTITY_LABELS: Record<string, string> = {
  accounts: 'Accounts',
  categories: 'Categories',
  tags: 'Tags',
  transactions: 'Transactions',
  transaction_splits: 'Splits',
  transaction_tags: 'Transaction tags',
  transaction_split_tags: 'Split tags',
};

function backupText(backup: ImportResponse['backup']): string {
  switch (backup.status) {
    case 'created':
      return `created ${backup.file ?? ''}`.trim();
    case 'skipped_unchanged':
      return 'skipped (unchanged)';
    case 'disabled':
      return 'disabled';
    default:
      return backup.status;
  }
}

/** Counts, warnings and backup status of a finished import (FD §3.10 step 4). */
export function ImportResult({ result }: { result: ImportResponse }) {
  const backupFailed = result.backup.status === 'failed';
  return (
    <Stack gap="sm" data-testid="import-result">
      <Alert color="green" title="Import finished">
        The data on every screen has been refreshed.
      </Alert>
      <Title order={4}>Records</Title>
      <Table maw={480} withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Entity</Table.Th>
            <Table.Th ta="right">Inserted</Table.Th>
            <Table.Th ta="right">Already present</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Object.entries(result.counts).map(([entity, counts]) => (
            <Table.Tr key={entity}>
              <Table.Td>{ENTITY_LABELS[entity] ?? entity}</Table.Td>
              <Table.Td ta="right">{counts.inserted}</Table.Td>
              <Table.Td ta="right">{counts.skipped_existing}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {result.warnings.length > 0 && (
        <Alert color="yellow" title={`Warnings (${result.warnings.length})`}>
          <List size="sm">
            {result.warnings.map((warning, i) => (
              <List.Item key={i}>{warning}</List.Item>
            ))}
          </List>
        </Alert>
      )}
      {backupFailed ? (
        <Alert color="yellow" title="Backup failed" data-testid="import-backup">
          The import was saved, but the backup after it failed — see the service log.
        </Alert>
      ) : (
        <Text size="sm" data-testid="import-backup">
          Backup: {backupText(result.backup)}
        </Text>
      )}
    </Stack>
  );
}

/** A rejected or failed import (FD §3.10 step 5). */
export function ImportError({ error }: { error: unknown }) {
  const rejected = error instanceof ApiError && (error.status === 400 || error.status === 404);
  return (
    <Alert color="red" title="Import failed" data-testid="import-error">
      <Text size="sm">{rejected ? (error as ApiError).detail : errorMessage(error)}</Text>
      {rejected && (
        <Text size="sm" mt="xs">
          Nothing was written to the database.
        </Text>
      )}
    </Alert>
  );
}
