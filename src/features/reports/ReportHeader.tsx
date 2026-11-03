import { Button, Group, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { downloadCsv } from '../../lib/csv';

interface Props {
  title: string;
  control: ReactNode;
  /** File name and CSV text, or `null` while there is nothing to download. */
  csv: { fileName: string; build: () => string } | null;
}

export function ReportHeader({ title, control, csv }: Props) {
  return (
    <Group justify="space-between" align="flex-end" wrap="wrap">
      <Group gap="lg" align="center" wrap="wrap">
        <Title order={2}>{title}</Title>
        {control}
      </Group>
      <Button
        size="xs"
        variant="default"
        disabled={!csv}
        onClick={() => csv && downloadCsv(csv.fileName, csv.build())}
      >
        Download CSV
      </Button>
    </Group>
  );
}
