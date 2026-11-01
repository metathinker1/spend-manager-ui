import { Button, Group, Text } from '@mantine/core';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

export function Pager({ page, pageSize, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1 && page === 1) return null;
  return (
    <Group justify="center" gap="sm" data-testid="pager">
      <Button size="xs" variant="default" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <Text size="sm">
        Page {page} of {pages}
      </Text>
      <Button size="xs" variant="default" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </Group>
  );
}
