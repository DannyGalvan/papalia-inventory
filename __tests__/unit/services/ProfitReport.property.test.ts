/**
 * Tests for the profit report computation (computeProfitReport) and the
 * timezone-aware date range helpers it relies on.
 *
 * computeProfitReport is pure; the repositories it would otherwise load from
 * are mocked so no native SQLite module is required.
 */

import fc from 'fast-check';
import type { LogHeader } from '../../../src/database/models/LogHeader';
import {
  computeProfitReport,
  ProfitContext,
} from '../../../src/services/ProfitReportService';
import {
  bucketFor,
  chooseGranularity,
  getPresetRange,
  normalizeRange,
  previousRange,
} from '../../../src/utils/dateRanges';

jest.mock('typeorm', () => ({ Between: (a: unknown, b: unknown) => [a, b] }));
jest.mock('../../../src/database/repository/LogHeaderRepository', () => ({
  LogHeaderRepository: { find: jest.fn() },
}));
jest.mock('../../../src/database/repository/ProductRepository', () => ({
  ProductRepository: { find: jest.fn() },
}));
jest.mock('../../../src/database/repository/MovementTypeRepository', () => ({
  getAllMovementTypes: jest.fn(),
  toBool: (v: unknown) => v === true || v === 1 || v === '1' || v === 'true',
}));

const TZ = 'America/Guatemala'; // UTC-6, no DST
const SALE = 1;
const GIFT = 3;
const PURCHASE = 7;

const RANGE = {
  from: new Date('2026-11-01T06:00:00.000Z'), // 2026-11-01 00:00 local
  to: new Date('2026-12-01T05:59:59.999Z'), // 2026-11-30 23:59:59.999 local
};

const ctx = (costs: Record<string, number> = {}): ProfitContext => ({
  saleTypeIds: new Set([SALE]),
  currentCostByCode: new Map(Object.entries(costs)),
  typeNames: {
    [SALE]: 'Venta',
    [GIFT]: 'Regalo clientes',
    [PURCHASE]: 'Compra',
  },
  timezone: TZ,
});

interface DetailInput {
  code: string;
  quantity: number;
  price: number;
  unitCost: number | null;
}

let nextId = 1;
const header = (
  createdAt: Date,
  type: number,
  isInput: boolean,
  details: DetailInput[],
): LogHeader =>
  ({
    id: nextId++,
    type,
    comments: '',
    createdAt,
    isInput,
    logDetails: details.map(d => ({
      id: nextId++,
      productCode: d.code,
      name: `Producto ${d.code}`,
      quantity: d.quantity,
      price: d.price,
      total: d.price * d.quantity,
      unitCost: d.unitCost,
    })),
  } as unknown as LogHeader);

const at = (iso: string) => new Date(iso);

describe('computeProfitReport — worked example', () => {
  const headers = [
    // Sale: 3 × Q10 at cost Q6 → revenue 30, COGS 18
    header(at('2026-11-05T15:00:00Z'), SALE, false, [
      { code: 'A', quantity: 3, price: 10, unitCost: 6 },
    ]),
    // Sale: 2 × Q20, legacy row without snapshot → current cost Q5 → COGS 10
    header(at('2026-11-06T15:00:00Z'), SALE, false, [
      { code: 'B', quantity: 2, price: 20, unitCost: null },
    ]),
    // Gift: 1 × A at cost 6 → non-sale cost 6, no revenue
    header(at('2026-11-07T15:00:00Z'), GIFT, false, [
      { code: 'A', quantity: 1, price: 10, unitCost: 6 },
    ]),
    // Purchase: 10 × A at cost 6 → purchasesCost 60, never revenue
    header(at('2026-11-08T15:00:00Z'), PURCHASE, true, [
      { code: 'A', quantity: 10, price: 10, unitCost: 6 },
    ]),
    // Previous period sale (October): revenue 10, cost 6 → net 4
    header(at('2026-10-20T15:00:00Z'), SALE, false, [
      { code: 'A', quantity: 1, price: 10, unitCost: 6 },
    ]),
    // Outside both periods: ignored
    header(at('2026-06-01T15:00:00Z'), SALE, false, [
      { code: 'A', quantity: 100, price: 10, unitCost: 0 },
    ]),
  ];

  const report = computeProfitReport(headers, RANGE, ctx({ A: 6, B: 5 }));

  it('computes revenue, costs and profit', () => {
    expect(report.revenue).toBe(70);
    expect(report.costOfGoodsSold).toBe(28);
    expect(report.grossProfit).toBe(42);
    expect(report.grossMarginPct).toBeCloseTo(60, 5);
    expect(report.nonSaleOutputCost).toBe(6);
    expect(report.netProfit).toBe(36);
    expect(report.purchasesCost).toBe(60);
    expect(report.unitsSold).toBe(5);
    expect(report.salesCount).toBe(2);
    expect(report.averageTicket).toBe(35);
  });

  it('compares against the previous period', () => {
    expect(report.previous.netProfit).toBe(4);
    expect(report.netProfitChangePct).toBeCloseTo(800, 5);
  });

  it('reports data-quality warnings', () => {
    expect(report.detailsWithoutHistoricalCost).toBe(1);
    expect(report.productsWithoutCost).toEqual([]);
  });

  it('ranks products by profit and groups non-sale outputs', () => {
    expect(report.topByProfit.map(p => p.code)).toEqual(['B', 'A']);
    expect(report.topByProfit[0].profit).toBe(30);
    expect(report.nonSaleByType).toEqual([
      { typeName: 'Regalo clientes', units: 1, cost: 6 },
    ]);
  });

  it('builds a daily timeline in local time', () => {
    expect(report.granularity).toBe('day');
    expect(report.timeline.map(p => p.key)).toEqual([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
    ]);
    expect(report.timeline[2].netProfit).toBe(-6);
  });

  it('keeps historical profit when the current cost changes', () => {
    const changed = computeProfitReport(headers, RANGE, ctx({ A: 99, B: 5 }));
    expect(changed.costOfGoodsSold).toBe(report.costOfGoodsSold);
  });

  it('flags sold products without cost', () => {
    const r = computeProfitReport(
      [
        header(at('2026-11-05T15:00:00Z'), SALE, false, [
          { code: 'Z', quantity: 1, price: 10, unitCost: 0 },
        ]),
      ],
      RANGE,
      ctx(),
    );
    expect(r.productsWithoutCost).toEqual([{ code: 'Z', name: 'Producto Z' }]);
  });
});

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

const detailArb = fc.record({
  code: fc.constantFrom('A', 'B', 'C'),
  quantity: fc.integer({ min: 1, max: 50 }),
  price: fc.integer({ min: 0, max: 500 }),
  unitCost: fc.option(fc.integer({ min: 0, max: 500 }), { nil: null }),
});

const headerArb = fc
  .record({
    offsetMs: fc.integer({
      min: 0,
      max: RANGE.to.getTime() - RANGE.from.getTime(),
    }),
    type: fc.constantFrom(SALE, GIFT, PURCHASE),
    details: fc.array(detailArb, { minLength: 1, maxLength: 4 }),
  })
  .map(h =>
    header(
      new Date(RANGE.from.getTime() + h.offsetMs),
      h.type,
      h.type === PURCHASE,
      h.details,
    ),
  );

const costs = { A: 3, B: 7, C: 11 };

describe('computeProfitReport — properties', () => {
  it('netProfit = revenue − COGS − nonSaleOutputCost', () => {
    fc.assert(
      fc.property(fc.array(headerArb, { maxLength: 20 }), headers => {
        const r = computeProfitReport(headers, RANGE, ctx(costs));
        expect(r.grossProfit).toBeCloseTo(r.revenue - r.costOfGoodsSold, 6);
        expect(r.netProfit).toBeCloseTo(
          r.revenue - r.costOfGoodsSold - r.nonSaleOutputCost,
          6,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('only sale-type outputs contribute revenue', () => {
    fc.assert(
      fc.property(fc.array(headerArb, { maxLength: 20 }), headers => {
        const r = computeProfitReport(headers, RANGE, ctx(costs));
        const expected = headers
          .filter(h => h.type === SALE)
          .flatMap(h => h.logDetails)
          .reduce((s, d) => s + d.total, 0);
        expect(r.revenue).toBeCloseTo(expected, 6);
      }),
      { numRuns: 100 },
    );
  });

  it('timeline sums match the totals', () => {
    fc.assert(
      fc.property(fc.array(headerArb, { maxLength: 20 }), headers => {
        const r = computeProfitReport(headers, RANGE, ctx(costs));
        const revenue = r.timeline.reduce((s, p) => s + p.revenue, 0);
        const net = r.timeline.reduce((s, p) => s + p.netProfit, 0);
        expect(revenue).toBeCloseTo(r.revenue, 6);
        expect(net).toBeCloseTo(r.netProfit, 6);
      }),
      { numRuns: 100 },
    );
  });

  it('ignores movements outside the range and the previous period', () => {
    fc.assert(
      fc.property(fc.array(headerArb, { maxLength: 10 }), headers => {
        const base = computeProfitReport(headers, RANGE, ctx(costs));
        const far = header(at('2020-01-01T00:00:00Z'), SALE, false, [
          { code: 'A', quantity: 5, price: 100, unitCost: 1 },
        ]);
        const withFar = computeProfitReport(
          [...headers, far],
          RANGE,
          ctx(costs),
        );
        expect(withFar.revenue).toBe(base.revenue);
        expect(withFar.previous.revenue).toBe(base.previous.revenue);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Date ranges
// ---------------------------------------------------------------------------

describe('dateRanges', () => {
  const now = new Date('2026-11-04T18:00:00Z'); // Wed 2026-11-04 12:00 local

  it('resolves presets to whole local days', () => {
    expect(getPresetRange('today', TZ, now)).toEqual({
      from: new Date('2026-11-04T06:00:00.000Z'),
      to: new Date('2026-11-05T05:59:59.999Z'),
    });
    expect(getPresetRange('week', TZ, now)).toEqual({
      from: new Date('2026-11-02T06:00:00.000Z'), // Monday
      to: new Date('2026-11-09T05:59:59.999Z'),
    });
    expect(getPresetRange('month', TZ, now)).toEqual(RANGE);
    expect(getPresetRange('prevMonth', TZ, now)).toEqual({
      from: new Date('2026-10-01T06:00:00.000Z'),
      to: new Date('2026-11-01T05:59:59.999Z'),
    });
  });

  it('normalizes a custom range and swaps reversed dates', () => {
    expect(
      normalizeRange(
        new Date('2026-11-10T20:00:00Z'),
        new Date('2026-11-03T08:00:00Z'),
        TZ,
      ),
    ).toEqual({
      from: new Date('2026-11-03T06:00:00.000Z'),
      to: new Date('2026-11-11T05:59:59.999Z'),
    });
  });

  it('previous range has the same length and ends right before', () => {
    const prev = previousRange(RANGE);
    expect(prev.to.getTime()).toBe(RANGE.from.getTime() - 1);
    expect(prev.to.getTime() - prev.from.getTime()).toBe(
      RANGE.to.getTime() - RANGE.from.getTime(),
    );
  });

  it('chooses granularity by range length', () => {
    expect(chooseGranularity(RANGE)).toBe('day');
    expect(
      chooseGranularity({
        from: RANGE.from,
        to: new Date('2027-01-15T00:00:00Z'),
      }),
    ).toBe('week');
    expect(
      chooseGranularity({
        from: RANGE.from,
        to: new Date('2027-06-01T00:00:00Z'),
      }),
    ).toBe('month');
  });

  it('buckets by local day, Monday-based week and month', () => {
    // 2026-11-08 02:00Z is still Saturday 2026-11-07 in Guatemala.
    const d = new Date('2026-11-08T02:00:00Z');
    expect(bucketFor(d, 'day', TZ)).toEqual({
      key: '2026-11-07',
      label: '7 nov',
    });
    expect(bucketFor(d, 'week', TZ)).toEqual({
      key: '2026-11-02',
      label: 'Sem 2 nov',
    });
    expect(bucketFor(d, 'month', TZ)).toEqual({
      key: '2026-11',
      label: 'nov 2026',
    });
  });
});
