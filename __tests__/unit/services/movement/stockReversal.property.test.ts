import fc from 'fast-check';
import {
  describeStockViolations,
  planStockReversal,
} from '../../../../src/services/movement/stockReversal';
import { MovementLine } from '../../../../src/services/movement/types';

const codeArb = fc.constantFrom('A', 'B', 'C', 'D');
const lineArb: fc.Arbitrary<MovementLine> = fc.record({
  productCode: codeArb,
  name: fc.string({ maxLength: 10 }),
  quantity: fc.integer({ min: 1, max: 1000 }),
});
const linesArb = fc.array(lineArb, { minLength: 1, maxLength: 8 });
const stockArb = fc.dictionary(codeArb, fc.integer({ min: 0, max: 2000 }));

const totalsByCode = (lines: MovementLine[]) => {
  const totals = new Map<string, number>();
  lines.forEach(l =>
    totals.set(l.productCode, (totals.get(l.productCode) ?? 0) + l.quantity),
  );
  return totals;
};

describe('planStockReversal', () => {
  it('cancelling an output always returns stock and never violates', () => {
    fc.assert(
      fc.property(linesArb, stockArb, (lines, stockObj) => {
        const stock = new Map(Object.entries(stockObj));
        const plan = planStockReversal({ isInput: false, lines }, stock);
        expect(plan.violations).toEqual([]);
        plan.adjustments.forEach(a => expect(a.delta).toBeGreaterThan(0));
      }),
    );
  });

  it('cancelling an input subtracts the aggregated quantity per product', () => {
    fc.assert(
      fc.property(linesArb, stockArb, (lines, stockObj) => {
        const stock = new Map(Object.entries(stockObj));
        const plan = planStockReversal({ isInput: true, lines }, stock);
        const totals = totalsByCode(lines);

        // One adjustment per existing product, equal to -total.
        const existing = [...totals.keys()].filter(c => stock.has(c));
        expect(plan.adjustments.map(a => a.productCode).sort()).toEqual(
          existing.sort(),
        );
        plan.adjustments.forEach(a =>
          expect(a.delta).toBe(-(totals.get(a.productCode) as number)),
        );

        // A violation exists exactly when the stock cannot cover the input.
        existing.forEach(code => {
          const violates =
            (stock.get(code) as number) < (totals.get(code) as number);
          expect(plan.violations.some(v => v.productCode === code)).toBe(
            violates,
          );
        });
      }),
    );
  });

  it('applying an input reversal after the input restores the original stock', () => {
    fc.assert(
      fc.property(linesArb, stockArb, (lines, stockObj) => {
        const before = new Map(Object.entries(stockObj));
        const after = new Map(before);
        totalsByCode(lines).forEach((qty, code) => {
          if (after.has(code)) {
            after.set(code, (after.get(code) as number) + qty);
          }
        });
        const plan = planStockReversal({ isInput: true, lines }, after);
        expect(plan.violations).toEqual([]);
        plan.adjustments.forEach(a =>
          after.set(
            a.productCode,
            (after.get(a.productCode) as number) + a.delta,
          ),
        );
        expect(after).toEqual(before);
      }),
    );
  });

  it('skips products that no longer exist', () => {
    const plan = planStockReversal(
      { isInput: true, lines: [{ productCode: 'X', name: 'X', quantity: 3 }] },
      new Map(),
    );
    expect(plan).toEqual({ adjustments: [], violations: [] });
  });

  it('describes violations in Spanish', () => {
    expect(
      describeStockViolations([
        { productCode: 'A', name: 'Café', currentStock: 2, resultingStock: -3 },
      ]),
    ).toBe('Café (stock actual 2, quedaría en -3)');
  });
});
