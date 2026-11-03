import { Button, Group, Modal, Text } from '@mantine/core';

interface Props {
  opened: boolean;
  snapshot: string;
  environment: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Names the snapshot and the target environment before anything is written (FR-I2). */
export function ConfirmImportDialog({ opened, snapshot, environment, onCancel, onConfirm }: Props) {
  return (
    <Modal opened={opened} onClose={onCancel} title="Confirm import" centered>
      <Text>
        Import <b>{snapshot}</b> into the <b>{environment.toUpperCase()}</b> database?
      </Text>
      <Text size="sm" c="dimmed" mt="xs">
        Only records that are not in the database yet are added. A backup is taken afterwards when
        backups are enabled.
      </Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onCancel} data-autofocus>
          Cancel
        </Button>
        <Button color={environment === 'production' ? 'red' : undefined} onClick={onConfirm}>
          Import
        </Button>
      </Group>
    </Modal>
  );
}
