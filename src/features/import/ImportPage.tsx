import { Alert, Button, Loader, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { ApiError } from '../../api/client';
import { useHealth, useImport, useSnapshots } from '../../api/hooks';
import { QueryErrorPanel } from '../../app/QueryErrorPanel';
import { ConfirmImportDialog } from './ConfirmImportDialog';
import { ImportError, ImportResult } from './ImportResult';
import { SnapshotList } from './SnapshotList';

/** Pick a MoneyWell snapshot, confirm, import (FR-I1–I5). */
export function ImportPage() {
  const env = useHealth().data?.env ?? 'unknown';
  const snapshots = useSnapshots();
  const importer = useImport();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const confirm = () => {
    setConfirming(false);
    if (selected) importer.mutate(selected);
  };

  return (
    <Stack gap="md" maw={760}>
      <Title order={2}>Import from MoneyWell</Title>
      {snapshots.isPending ? (
        <Loader aria-label="Loading snapshots" />
      ) : snapshots.isError ? (
        snapshots.error instanceof ApiError && snapshots.error.status === 404 ? (
          <Alert
            color="red"
            title="MoneyWell store folder not found"
            data-testid="snapshots-missing"
          >
            Check MONEYWELL_STORE_ROOT in the service settings.
          </Alert>
        ) : (
          <QueryErrorPanel error={snapshots.error} onRetry={() => void snapshots.refetch()} />
        )
      ) : snapshots.data.length === 0 ? (
        <Text data-testid="snapshots-empty">No MoneyWell snapshots found in the store folder.</Text>
      ) : (
        <>
          <SnapshotList
            snapshots={snapshots.data}
            selected={selected}
            onSelect={setSelected}
            disabled={importer.isPending}
          />
          <div>
            <Button
              disabled={!selected || importer.isPending}
              loading={importer.isPending}
              onClick={() => setConfirming(true)}
            >
              Import…
            </Button>
          </div>
        </>
      )}
      {selected && (
        <ConfirmImportDialog
          opened={confirming}
          snapshot={selected}
          environment={env}
          onCancel={() => setConfirming(false)}
          onConfirm={confirm}
        />
      )}
      {importer.isPending && (
        <Text size="sm">Importing {importer.variables}… this can take a while.</Text>
      )}
      {importer.isSuccess && <ImportResult result={importer.data} />}
      {importer.isError && <ImportError error={importer.error} />}
    </Stack>
  );
}
