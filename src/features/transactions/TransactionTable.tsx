import { Badge, Group, Table, Text, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { Fragment, useState } from 'react';
import type { TransactionRow } from '../../api/client';
import { formatDate } from '../../lib/dates';
import { formatCents } from '../../lib/money';
import classes from './TransactionTable.module.css';

interface Props {
  items: TransactionRow[];
  /** Split rows start expanded (a category or uncategorized condition is active). */
  autoExpand: boolean;
}

function CategoryCell({
  name,
  isTransfer,
}: {
  name: string | null | undefined;
  isTransfer: boolean;
}) {
  return (
    <Group gap={6} wrap="nowrap">
      {name ? (
        <Text size="sm">{name}</Text>
      ) : (
        <Text size="sm" c="dimmed">
          Uncategorized
        </Text>
      )}
      {isTransfer && (
        <Badge size="xs" variant="light" color="gray">
          Transfer
        </Badge>
      )}
    </Group>
  );
}

/**
 * One row per transaction; split transactions expand to their splits
 * (FD §3.4). Mount with a `key` per filter so manual toggles reset.
 */
export function TransactionTable({ items, autoExpand }: Props) {
  // Ids the user toggled away from the default (expanded when autoExpand).
  const [toggled, setToggled] = useState<ReadonlySet<number>>(new Set());
  const toggle = (id: number) =>
    setToggled((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table highlightOnHover verticalSpacing={6} data-testid="transaction-table">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={36}>
              <VisuallyHidden>Splits</VisuallyHidden>
            </Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Account</Table.Th>
            <Table.Th>Payee</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th>Memo</Table.Th>
            <Table.Th ta="right">Amount</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item) => {
            const expanded = item.is_split && autoExpand !== toggled.has(item.id);
            return (
              <Fragment key={item.id}>
                <Table.Tr data-testid={`transaction-row-${item.id}`}>
                  <Table.Td>
                    {item.is_split && (
                      <UnstyledButton
                        className={classes.expander}
                        aria-expanded={expanded}
                        aria-label={`${expanded ? 'Hide' : 'Show'} splits of ${item.payee ?? 'transaction'}`}
                        onClick={() => toggle(item.id)}
                      >
                        {expanded ? '▾' : '▸'}
                      </UnstyledButton>
                    )}
                  </Table.Td>
                  <Table.Td className={classes.nowrap}>{formatDate(item.date)}</Table.Td>
                  <Table.Td>{item.account_name}</Table.Td>
                  <Table.Td>{item.payee}</Table.Td>
                  <Table.Td>
                    {item.is_split ? (
                      <Text size="sm">Split ({item.splits.length})</Text>
                    ) : (
                      <CategoryCell name={item.category_name} isTransfer={item.is_transfer} />
                    )}
                  </Table.Td>
                  <Table.Td>{item.memo}</Table.Td>
                  <Table.Td ta="right" className={classes.amount}>
                    {formatCents(item.amount_cents)}
                  </Table.Td>
                </Table.Tr>
                {expanded &&
                  item.splits.map((split) => (
                    <Table.Tr
                      key={`split-${split.id}`}
                      data-testid={`split-row-${split.id}`}
                      data-matches={split.matches}
                      className={
                        split.matches ? classes.split : `${classes.split} ${classes.dimmed}`
                      }
                    >
                      <Table.Td />
                      <Table.Td colSpan={3}>
                        {!split.matches && <VisuallyHidden>Not in filter: </VisuallyHidden>}
                      </Table.Td>
                      <Table.Td>
                        <CategoryCell name={split.category_name} isTransfer={split.is_transfer} />
                      </Table.Td>
                      <Table.Td>{split.memo}</Table.Td>
                      <Table.Td ta="right" className={classes.amount}>
                        {formatCents(split.amount_cents)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
              </Fragment>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
