import { Badge, Group, Radio, Stack, Text } from '@mantine/core';
import type { Snapshot } from '../../api/client';
import { formatDate } from '../../lib/dates';

interface Props {
  snapshots: Snapshot[];
  selected: string | null;
  onSelect: (name: string) => void;
  disabled?: boolean;
}

/** MoneyWell snapshots, newest first; one can be selected (FD §3.10). */
export function SnapshotList({ snapshots, selected, onSelect, disabled }: Props) {
  return (
    <Radio.Group
      value={selected}
      onChange={onSelect}
      label="MoneyWell snapshots"
      description="Newest first"
    >
      <Stack gap={6} mt="xs" data-testid="snapshot-list">
        {snapshots.map((snapshot) => (
          <Radio
            key={snapshot.name}
            value={snapshot.name}
            disabled={disabled}
            label={
              <Group gap="sm" wrap="nowrap">
                <Text size="sm" ff="monospace">
                  {snapshot.name}
                </Text>
                <Badge size="xs" variant="light" color="gray">
                  {snapshot.kind}
                </Badge>
                <Text size="sm" c="dimmed">
                  {snapshot.snapshot_date ? formatDate(snapshot.snapshot_date) : '—'}
                </Text>
              </Group>
            }
          />
        ))}
      </Stack>
    </Radio.Group>
  );
}
