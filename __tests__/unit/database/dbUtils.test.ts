import fc from 'fast-check';

// The react-native export condition resolves TypeORM's ESM browser build,
// which Jest does not transform; use the real CommonJS build instead.
jest.mock('typeorm', () => jest.requireActual('typeorm/index.js'));

import { FindOperator } from 'typeorm';
import { buildProductStatusWhere } from '../../../src/database/repository/productStatus';
import { activeMovementsWhere } from '../../../src/database/utils/movementFilters';
import {
  isNitroNull,
  toBool,
  toNumber,
  toText,
} from '../../../src/database/utils/nitroValues';
import { toSqliteUtcDatetime } from '../../../src/database/utils/sqlExecutor';

const NITRO_NULL = { isNitroSQLiteNull: true };

/** Render a Raw FindOperator's SQL for a given column alias. */
const rawSql = (op: unknown, alias = '"col"') =>
  (op as FindOperator<boolean> & { getSql: (a: string) => string }).getSql(
    alias,
  );

describe('nitroValues', () => {
  it('detects the nitro null marker', () => {
    expect(isNitroNull(NITRO_NULL)).toBe(true);
    expect(isNitroNull(null)).toBe(false);
    expect(isNitroNull({})).toBe(false);
    expect(isNitroNull(0)).toBe(false);
  });

  it('coerces booleans', () => {
    [true, 1, '1', 'true'].forEach(v => expect(toBool(v)).toBe(true));
    [false, 0, '0', 'false', NITRO_NULL, null, undefined].forEach(v =>
      expect(toBool(v)).toBe(false),
    );
  });

  it('coerces numbers and text with fallbacks', () => {
    expect(toNumber(5)).toBe(5);
    expect(toNumber('2.5')).toBe(2.5);
    expect(toNumber(NITRO_NULL, 7)).toBe(7);
    expect(toNumber('abc', 1)).toBe(1);
    expect(toText('x')).toBe('x');
    expect(toText(NITRO_NULL, 'd')).toBe('d');
    fc.assert(
      fc.property(fc.anything(), v => {
        expect(Number.isFinite(toNumber(v))).toBe(true);
      }),
    );
  });
});

describe('toSqliteUtcDatetime', () => {
  it('matches the layout TypeORM uses for SQLite datetimes', () => {
    expect(toSqliteUtcDatetime(new Date('2026-11-04T05:06:07.089Z'))).toBe(
      '2026-11-04 05:06:07.089',
    );
  });

  it('round-trips through the TypeORM hydration rule', () => {
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2000-01-01T00:00:00Z'),
          max: new Date('2099-12-31T23:59:59Z'),
          noInvalidDate: true,
        }),
        date => {
          const stored = toSqliteUtcDatetime(date);
          expect(stored).toMatch(/^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d$/);
          expect(new Date(stored.replace(' ', 'T') + 'Z').getTime()).toBe(
            date.getTime(),
          );
        },
      ),
    );
  });
});

describe('query filters', () => {
  it('builds product status filters with integer literals', () => {
    expect(buildProductStatusWhere('all')).toEqual({});
    expect(rawSql(buildProductStatusWhere('active').isActive)).toBe(
      '"col" = 1',
    );
    expect(rawSql(buildProductStatusWhere('inactive').isActive)).toBe(
      '"col" = 0',
    );
  });

  it('keeps only non-cancelled movements', () => {
    expect(rawSql(activeMovementsWhere().isCancelled)).toBe('"col" = 0');
  });
});
