import { ALL_IN_OUT_ENUM } from '../config/constants';
import { LogHeader } from '../database/models/LogHeader';
import { LogHeaderRepository } from '../database/repository/LogHeaderRepository';
import {
  activeMovementsWhere,
  movementDateBetween,
} from '../database/utils/movementFilters';
import { effectiveMovementDate } from './movement/movementDate';
import {
  getAllMovementTypes,
  toBool,
} from '../database/repository/MovementTypeRepository';
import { ProductRepository } from '../database/repository/ProductRepository';
import {
  bucketFor,
  chooseGranularity,
  DateRange,
  Granularity,
  previousRange,
} from '../utils/dateRanges';
import { LOW_MARGIN_THRESHOLD_PCT } from '../utils/profit';

// --- Types ---

export interface ProfitTimelinePoint {
  key: string;
  label: string;
  revenue: number;
  cost: number;
  netProfit: number;
}

export interface ProductProfit {
  code: string;
  name: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  /** Null when revenue is 0 (e.g. sold at price 0). */
  marginPct: number | null;
}

export interface NonSaleByType {
  typeName: string;
  units: number;
  cost: number;
}

export interface ProfitSummary {
  /** Σ sale totals (outputs whose type is flagged as sale). */
  revenue: number;
  /** Σ unit cost × quantity of sold items. */
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPct: number | null;
  /** Cost of outputs that are not sales (gifts, extraordinary…). */
  nonSaleOutputCost: number;
  netProfit: number;
  unitsSold: number;
  /** Number of sale movements (headers). */
  salesCount: number;
  averageTicket: number;
  /** Σ cost of inputs (purchases); informative, not subtracted from profit. */
  purchasesCost: number;
}

export interface ProfitReportData extends ProfitSummary {
  range: DateRange;
  granularity: Granularity;
  previous: ProfitSummary;
  /** Null when the previous period's net profit is 0. */
  netProfitChangePct: number | null;
  timeline: ProfitTimelinePoint[];
  topByProfit: ProductProfit[];
  lowMarginProducts: ProductProfit[];
  nonSaleByType: NonSaleByType[];
  /** Sold products whose effective unit cost is 0 (profit is overstated). */
  productsWithoutCost: { code: string; name: string }[];
  /** Details without a cost snapshot that fell back to the current cost. */
  detailsWithoutHistoricalCost: number;
}

export interface ProfitContext {
  saleTypeIds: Set<number>;
  /** Current product cost, used when a detail has no cost snapshot. */
  currentCostByCode: Map<string, number>;
  typeNames: Record<number, string>;
  timezone: string;
}

// --- Pure computation ---

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** A cost snapshot is valid only when it is a real number (not null/marker). */
const snapshotCost = (v: unknown): number | null => {
  if (v === null || v === undefined || typeof v === 'object' || v === '') {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const inRange = (d: Date, range: DateRange) =>
  d.getTime() >= range.from.getTime() && d.getTime() <= range.to.getTime();

const emptySummary = (): ProfitSummary => ({
  revenue: 0,
  costOfGoodsSold: 0,
  grossProfit: 0,
  grossMarginPct: null,
  nonSaleOutputCost: 0,
  netProfit: 0,
  unitsSold: 0,
  salesCount: 0,
  averageTicket: 0,
  purchasesCost: 0,
});

/**
 * Compute the profit report for `range` from movement headers (with details).
 * Headers outside `range` and `previousRange(range)` are ignored, so callers
 * may pass a superset.
 */
export function computeProfitReport(
  headers: LogHeader[],
  range: DateRange,
  ctx: ProfitContext,
): ProfitReportData {
  const prevRange = previousRange(range);
  const granularity = chooseGranularity(range);

  const current = emptySummary();
  const previous = emptySummary();
  const timeline = new Map<string, ProfitTimelinePoint>();
  const products = new Map<string, ProductProfit>();
  const nonSale = new Map<string, NonSaleByType>();
  const withoutCost = new Map<string, string>();
  let detailsWithoutHistoricalCost = 0;

  for (const header of headers) {
    // Business date (sale/receipt), not the registration date.
    const occurredAt = effectiveMovementDate(header);
    if (!occurredAt) {
      continue;
    }
    const isCurrent = inRange(occurredAt, range);
    if (!isCurrent && !inRange(occurredAt, prevRange)) {
      continue;
    }
    const summary = isCurrent ? current : previous;
    const isInput = toBool(header.isInput);
    const type = num(header.type);
    const isSale = !isInput && ctx.saleTypeIds.has(type);
    const details = Array.isArray(header.logDetails) ? header.logDetails : [];

    let headerRevenue = 0;
    let headerCost = 0;

    for (const detail of details) {
      const quantity = num(detail.quantity);
      const snapshot = snapshotCost(detail.unitCost);
      const unitCost =
        snapshot ?? num(ctx.currentCostByCode.get(detail.productCode));
      if (snapshot === null && isCurrent) {
        detailsWithoutHistoricalCost++;
      }
      const cost = unitCost * quantity;

      if (isInput) {
        summary.purchasesCost += cost;
        continue;
      }

      if (isSale) {
        const total =
          detail.total != null && typeof detail.total !== 'object'
            ? num(detail.total)
            : num(detail.price) * quantity;
        summary.revenue += total;
        summary.costOfGoodsSold += cost;
        summary.unitsSold += quantity;
        headerRevenue += total;
        headerCost += cost;

        if (isCurrent) {
          const p = products.get(detail.productCode) ?? {
            code: detail.productCode,
            name: detail.name || detail.productCode,
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            marginPct: null,
          };
          p.unitsSold += quantity;
          p.revenue += total;
          p.cost += cost;
          products.set(detail.productCode, p);
          if (unitCost <= 0) {
            withoutCost.set(detail.productCode, p.name);
          }
        }
      } else {
        summary.nonSaleOutputCost += cost;
        headerCost += cost;
        if (isCurrent) {
          const typeName = ctx.typeNames[type] ?? `Tipo ${type}`;
          const g = nonSale.get(typeName) ?? { typeName, units: 0, cost: 0 };
          g.units += quantity;
          g.cost += cost;
          nonSale.set(typeName, g);
        }
      }
    }

    if (isSale) {
      summary.salesCount++;
    }

    if (isCurrent && !isInput) {
      const bucket = bucketFor(occurredAt, granularity, ctx.timezone);
      const point = timeline.get(bucket.key) ?? {
        key: bucket.key,
        label: bucket.label,
        revenue: 0,
        cost: 0,
        netProfit: 0,
      };
      point.revenue += headerRevenue;
      point.cost += headerCost;
      point.netProfit += headerRevenue - headerCost;
      timeline.set(bucket.key, point);
    }
  }

  for (const s of [current, previous]) {
    s.grossProfit = s.revenue - s.costOfGoodsSold;
    s.grossMarginPct = s.revenue > 0 ? (s.grossProfit / s.revenue) * 100 : null;
    s.netProfit = s.grossProfit - s.nonSaleOutputCost;
    s.averageTicket = s.salesCount > 0 ? s.revenue / s.salesCount : 0;
  }

  const productList = Array.from(products.values()).map(p => {
    p.profit = p.revenue - p.cost;
    p.marginPct = p.revenue > 0 ? (p.profit / p.revenue) * 100 : null;
    return p;
  });

  const topByProfit = [...productList]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);
  const lowMarginProducts = productList
    .filter(p => p.marginPct !== null && p.marginPct < LOW_MARGIN_THRESHOLD_PCT)
    .sort((a, b) => (a.marginPct ?? 0) - (b.marginPct ?? 0))
    .slice(0, 10);

  const netProfitChangePct =
    previous.netProfit !== 0
      ? ((current.netProfit - previous.netProfit) /
          Math.abs(previous.netProfit)) *
        100
      : null;

  return {
    ...current,
    range,
    granularity,
    previous,
    netProfitChangePct,
    timeline: Array.from(timeline.values()).sort((a, b) =>
      a.key.localeCompare(b.key),
    ),
    topByProfit,
    lowMarginProducts,
    nonSaleByType: Array.from(nonSale.values()).sort((a, b) => b.cost - a.cost),
    productsWithoutCost: Array.from(withoutCost.entries()).map(
      ([code, name]) => ({ code, name }),
    ),
    detailsWithoutHistoricalCost,
  };
}

// --- Loader ---

/**
 * Load movements for `range` (and the previous period of equal length) and
 * compute the profit report.
 */
export async function getProfitReportData(
  range: DateRange,
  timezone: string,
): Promise<ProfitReportData> {
  const prev = previousRange(range);
  const [headers, movementTypes, products] = await Promise.all([
    LogHeaderRepository.find({
      where: {
        ...movementDateBetween(prev.from, range.to),
        ...activeMovementsWhere(),
      },
      relations: ['logDetails'],
    }),
    getAllMovementTypes(),
    ProductRepository.find(),
  ]);

  const typeNames: Record<number, string> = {
    ...(ALL_IN_OUT_ENUM as Record<number, string>),
  };
  const saleTypeIds = new Set<number>();
  for (const t of movementTypes) {
    typeNames[t.id] = t.name;
    if (!toBool(t.isInput) && toBool(t.isSale)) {
      saleTypeIds.add(t.id);
    }
  }

  const currentCostByCode = new Map<string, number>();
  for (const p of products) {
    currentCostByCode.set(p.code, num(p.cost));
  }

  return computeProfitReport(headers, range, {
    saleTypeIds,
    currentCostByCode,
    typeNames,
    timezone,
  });
}
