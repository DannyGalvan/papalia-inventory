/**
 * Timezone-aware date range helpers for reports.
 *
 * All functions are pure: they receive the IANA timezone and (optionally) the
 * current instant, and return UTC `Date` instants that correspond to local
 * calendar boundaries in that timezone.
 */
import { getUTCOffsetMs } from './dateTime';

const DAY_MS = 24 * 60 * 60 * 1000;

export type RangePreset = 'today' | 'week' | 'month' | 'prevMonth';
export type Granularity = 'day' | 'week' | 'month';

export interface DateRange {
  from: Date;
  to: Date;
}

interface LocalDate {
  year: number;
  /** 0-based month. */
  month: number;
  day: number;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
}

const MONTHS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Calendar date of `at` as seen in `iana`. */
export const toLocalDate = (at: Date, iana: string): LocalDate => {
  const local = new Date(at.getTime() + getUTCOffsetMs(iana, at));
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    weekday: (local.getUTCDay() + 6) % 7,
  };
};

/** UTC instant of 00:00:00.000 local time on the given calendar date. */
export const startOfLocalDay = (
  year: number,
  month: number,
  day: number,
  iana: string,
): Date => {
  const guess = Date.UTC(year, month, day);
  // Offset can differ across DST changes; evaluate it at the target instant.
  const offset = getUTCOffsetMs(iana, new Date(guess));
  return new Date(guess - offset);
};

/** Inclusive range covering whole local days from `start` to `end`. */
const localDays = (
  start: { year: number; month: number; day: number },
  endExclusive: { year: number; month: number; day: number },
  iana: string,
): DateRange => ({
  from: startOfLocalDay(start.year, start.month, start.day, iana),
  to: new Date(
    startOfLocalDay(
      endExclusive.year,
      endExclusive.month,
      endExclusive.day,
      iana,
    ).getTime() - 1,
  ),
});

/** Resolve a quick-filter preset into a concrete range. Weeks start Monday. */
export const getPresetRange = (
  preset: RangePreset,
  iana: string,
  now: Date = new Date(),
): DateRange => {
  const t = toLocalDate(now, iana);
  switch (preset) {
    case 'today':
      return localDays(t, { ...t, day: t.day + 1 }, iana);
    case 'week': {
      const monday = t.day - t.weekday;
      return localDays(
        { year: t.year, month: t.month, day: monday },
        { year: t.year, month: t.month, day: monday + 7 },
        iana,
      );
    }
    case 'month':
      return localDays(
        { year: t.year, month: t.month, day: 1 },
        { year: t.year, month: t.month + 1, day: 1 },
        iana,
      );
    case 'prevMonth':
      return localDays(
        { year: t.year, month: t.month - 1, day: 1 },
        { year: t.year, month: t.month, day: 1 },
        iana,
      );
  }
};

/** Normalize a picked range to whole local days (start 00:00, end 23:59:59.999). */
export const normalizeRange = (
  from: Date,
  to: Date,
  iana: string,
): DateRange => {
  const [a, b] = from.getTime() <= to.getTime() ? [from, to] : [to, from];
  const s = toLocalDate(a, iana);
  const e = toLocalDate(b, iana);
  return localDays(s, { ...e, day: e.day + 1 }, iana);
};

/** The range of equal length immediately before `range`. */
export const previousRange = (range: DateRange): DateRange => {
  const length = range.to.getTime() - range.from.getTime();
  const to = new Date(range.from.getTime() - 1);
  return { from: new Date(to.getTime() - length), to };
};

/** ≤ 31 days → day, ≤ 120 days → week, otherwise month. */
export const chooseGranularity = (range: DateRange): Granularity => {
  const days = (range.to.getTime() - range.from.getTime() + 1) / DAY_MS;
  if (days <= 31) {
    return 'day';
  }
  if (days <= 120) {
    return 'week';
  }
  return 'month';
};

export interface Bucket {
  /** Sortable key, e.g. `2026-11-02`. */
  key: string;
  /** Short Spanish label, e.g. `2 nov`, `Sem 2 nov`, `nov 2026`. */
  label: string;
}

/** Bucket that `at` falls into for the given granularity and timezone. */
export const bucketFor = (
  at: Date,
  granularity: Granularity,
  iana: string,
): Bucket => {
  const t = toLocalDate(at, iana);
  if (granularity === 'month') {
    return {
      key: `${t.year}-${pad2(t.month + 1)}`,
      label: `${MONTHS_ES[t.month]} ${t.year}`,
    };
  }
  if (granularity === 'week') {
    const monday = new Date(Date.UTC(t.year, t.month, t.day - t.weekday));
    const y = monday.getUTCFullYear();
    const m = monday.getUTCMonth();
    const d = monday.getUTCDate();
    return {
      key: `${y}-${pad2(m + 1)}-${pad2(d)}`,
      label: `Sem ${d} ${MONTHS_ES[m]}`,
    };
  }
  return {
    key: `${t.year}-${pad2(t.month + 1)}-${pad2(t.day)}`,
    label: `${t.day} ${MONTHS_ES[t.month]}`,
  };
};
