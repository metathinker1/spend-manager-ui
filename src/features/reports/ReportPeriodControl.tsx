import { Group, SegmentedControl } from '@mantine/core';
import type { MatrixQuery } from '../../api/queryKeys';
import { addMonths, currentYearMonth, monthLabel } from '../../lib/dates';
import { Stepper } from '../transactions/PeriodControl';
import type { SpendingPeriod } from './reportPeriod';

/** Month | Year with ‹ › stepping (spending by category). */
export function SpendingPeriodControl({
  value,
  onChange,
}: {
  value: SpendingPeriod;
  onChange: (period: SpendingPeriod) => void;
}) {
  const month = value.month;
  return (
    <Group gap="sm">
      <SegmentedControl
        size="xs"
        aria-label="Report period"
        value={month === undefined ? 'year' : 'month'}
        data={[
          { value: 'month', label: 'Month' },
          { value: 'year', label: 'Year' },
        ]}
        onChange={(mode) => {
          const now = currentYearMonth();
          onChange(
            mode === 'month'
              ? { year: value.year, month: value.year === now.year ? now.month : 12 }
              : { year: value.year },
          );
        }}
      />
      {month === undefined ? (
        <Stepper
          name="year"
          label={String(value.year)}
          onStep={(delta) => onChange({ year: value.year + delta })}
        />
      ) : (
        <Stepper
          name="month"
          label={monthLabel({ year: value.year, month })}
          onStep={(delta) => onChange(addMonths({ year: value.year, month }, delta))}
        />
      )}
    </Group>
  );
}

/** Last 12 months | Year with ‹ › stepping (category by month). */
export function MatrixPeriodControl({
  value,
  onChange,
}: {
  value: MatrixQuery;
  onChange: (period: MatrixQuery) => void;
}) {
  return (
    <Group gap="sm">
      <SegmentedControl
        size="xs"
        aria-label="Report period"
        value={'year' in value ? 'year' : 'last12'}
        data={[
          { value: 'last12', label: 'Last 12 months' },
          { value: 'year', label: 'Year' },
        ]}
        onChange={(mode) =>
          onChange(mode === 'year' ? { year: currentYearMonth().year } : { range: 'last12' })
        }
      />
      {'year' in value && (
        <Stepper
          name="year"
          label={String(value.year)}
          onStep={(delta) => onChange({ year: value.year + delta })}
        />
      )}
    </Group>
  );
}
