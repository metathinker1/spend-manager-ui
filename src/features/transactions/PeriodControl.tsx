import { ActionIcon, Group, SegmentedControl, Text, TextInput } from '@mantine/core';
import { useState } from 'react';
import {
  addMonths,
  currentYearMonth,
  monthLabel,
  monthRange,
  yearRange,
  type DateRange,
} from '../../lib/dates';
import { periodMode, periodStart, type PeriodMode } from './period';

interface Props {
  dateFrom?: string;
  dateTo?: string;
  onChange: (range: Partial<DateRange>) => void;
}

const MODES: { value: PeriodMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

export function Stepper({
  label,
  name,
  onStep,
}: {
  label: string;
  name: string;
  onStep: (delta: number) => void;
}) {
  return (
    <Group gap={4} wrap="nowrap">
      <ActionIcon variant="default" aria-label={`Previous ${name}`} onClick={() => onStep(-1)}>
        ‹
      </ActionIcon>
      <Text size="sm" fw={500} miw={110} ta="center" aria-live="polite">
        {label}
      </Text>
      <ActionIcon variant="default" aria-label={`Next ${name}`} onClick={() => onStep(1)}>
        ›
      </ActionIcon>
    </Group>
  );
}

/** All / Month / Year / Custom; the mode is derived from the dates (FD §3.2). */
export function PeriodControl({ dateFrom, dateTo, onChange }: Props) {
  // "Custom" with dates that look like a month or year (or none) stays custom
  // until another mode is picked.
  const [customPicked, setCustomPicked] = useState(false);
  const derived = periodMode(dateFrom, dateTo);
  const mode = customPicked ? 'custom' : derived;

  const pickMode = (value: string) => {
    const next = value as PeriodMode;
    setCustomPicked(next === 'custom');
    const now = currentYearMonth();
    if (next === 'all') onChange({ dateFrom: undefined, dateTo: undefined });
    if (next === 'month') onChange(monthRange(now));
    if (next === 'year') onChange(yearRange(now.year));
  };

  return (
    <Group gap="sm" wrap="wrap">
      <SegmentedControl
        size="xs"
        value={mode}
        onChange={pickMode}
        data={MODES}
        aria-label="Period"
      />
      {mode === 'month' && dateFrom && (
        <Stepper
          name="month"
          label={monthLabel(periodStart(dateFrom))}
          onStep={(delta) => onChange(monthRange(addMonths(periodStart(dateFrom), delta)))}
        />
      )}
      {mode === 'year' && dateFrom && (
        <Stepper
          name="year"
          label={String(periodStart(dateFrom).year)}
          onStep={(delta) => onChange(yearRange(periodStart(dateFrom).year + delta))}
        />
      )}
      {mode === 'custom' && <CustomRange dateFrom={dateFrom} dateTo={dateTo} onChange={onChange} />}
    </Group>
  );
}

function CustomRange({ dateFrom, dateTo, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const update = (change: Partial<DateRange>) => {
    const from = 'dateFrom' in change ? change.dateFrom : dateFrom;
    const to = 'dateTo' in change ? change.dateTo : dateTo;
    if (from && to && from > to) {
      setError('"From" must not be after "To"');
      return;
    }
    setError(null);
    onChange({ dateFrom: from, dateTo: to });
  };
  return (
    <Group gap="xs" align="flex-start" wrap="nowrap">
      <TextInput
        type="date"
        size="xs"
        label="From"
        value={dateFrom ?? ''}
        max={dateTo}
        error={error}
        onChange={(e) => update({ dateFrom: e.currentTarget.value || undefined })}
      />
      <TextInput
        type="date"
        size="xs"
        label="To"
        value={dateTo ?? ''}
        min={dateFrom}
        onChange={(e) => update({ dateTo: e.currentTarget.value || undefined })}
      />
    </Group>
  );
}
