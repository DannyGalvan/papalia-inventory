import { Equal, LessThanOrEqual } from 'typeorm';
import { ALL_IN_OUT_ENUM } from '../config/constants';
import { LogDetailRepository } from '../database/repository/LogDetailRepository';
import { LogHeaderRepository } from '../database/repository/LogHeaderRepository';
import { ProductRepository } from '../database/repository/ProductRepository';

// --- Interfaces ---

export interface LowStockProduct {
  code: string;
  name: string;
  stock: number;
}

export interface MostMovedProduct {
  code: string;
  name: string;
  totalQuantity: number;
}

export interface CriticalReportData {
  lowStockProducts: LowStockProduct[];
  zeroStockProducts: LowStockProduct[];
  mostMovedProducts: MostMovedProduct[];
}

export interface StockDistribution {
  zero: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
}

export interface SummaryReportData {
  totalProducts: number;
  totalInventoryValue: number;
  totalUnitsInStock: number;
  stockDistribution: StockDistribution;
}

export interface MovementByType {
  typeName: string;
  totalQuantity: number;
  isInput: boolean;
}

export interface MovementReportData {
  totalEntryQuantity: number;
  totalExitQuantity: number;
  movementsByType: MovementByType[];
  topCategories: MovementByType[];
}

// --- Service Functions ---

/**
 * Fetches critical inventory report data including low stock products,
 * zero stock products, and the top 10 most moved products.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.6
 */
export async function getCriticalReportData(lowStockThreshold = 5): Promise<CriticalReportData> {
  try {
    // Low stock products (stock <= threshold)
    const lowStockEntities = await ProductRepository.find({
      where: {stock: LessThanOrEqual(lowStockThreshold)},
      order: {stock: 'ASC'},
    });

    const lowStockProducts: LowStockProduct[] = lowStockEntities.map(p => ({
      code: p.code,
      name: p.name,
      stock: p.stock,
    }));

    // Zero stock products (stock === 0)
    const zeroStockEntities = await ProductRepository.find({
      where: {stock: Equal(0)},
      order: {name: 'ASC'},
    });

    const zeroStockProducts: LowStockProduct[] = zeroStockEntities.map(p => ({
      code: p.code,
      name: p.name,
      stock: p.stock,
    }));

    // Top 10 most moved products by total quantity
    const mostMovedRaw = await LogDetailRepository.createQueryBuilder(
      'log_detail',
    )
      .select('log_detail.productCode', 'code')
      .addSelect('log_detail.name', 'name')
      .addSelect('SUM(log_detail.quantity)', 'totalQuantity')
      .groupBy('log_detail.productCode')
      .orderBy('totalQuantity', 'DESC')
      .limit(10)
      .getRawMany();

    const mostMovedProducts: MostMovedProduct[] = mostMovedRaw.map(row => ({
      code: row.code,
      name: row.name,
      totalQuantity: Number(row.totalQuantity),
    }));

    return {
      lowStockProducts,
      zeroStockProducts,
      mostMovedProducts,
    };
  } catch (error) {
    console.log('Error fetching critical report data:', error);
    return {
      lowStockProducts: [],
      zeroStockProducts: [],
      mostMovedProducts: [],
    };
  }
}

/**
 * Computes summary inventory data including total products, total value,
 * total units in stock, and stock distribution buckets.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export async function getSummaryReportData(lowStockThreshold = 5): Promise<SummaryReportData> {
  try {
    const products = await ProductRepository.find();

    const totalProducts = products.length;

    const totalInventoryValue = products.reduce(
      (sum, p) => sum + Number(p.price) * p.stock,
      0,
    );

    const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);

    const stockDistribution: StockDistribution = {
      zero: 0,
      low: 0,
      medium: 0,
      high: 0,
      veryHigh: 0,
    };

    for (const product of products) {
      const stock = product.stock;
      if (stock === 0) {
        stockDistribution.zero++;
      } else if (stock >= 1 && stock <= lowStockThreshold) {
        stockDistribution.low++;
      } else if (stock > lowStockThreshold && stock <= lowStockThreshold * 4) {
        stockDistribution.medium++;
      } else if (stock > lowStockThreshold * 4 && stock <= lowStockThreshold * 10) {
        stockDistribution.high++;
      } else {
        stockDistribution.veryHigh++;
      }
    }

    return {
      totalProducts,
      totalInventoryValue,
      totalUnitsInStock,
      stockDistribution,
    };
  } catch (error) {
    console.log('Error fetching summary report data:', error);
    return {
      totalProducts: 0,
      totalInventoryValue: 0,
      totalUnitsInStock: 0,
      stockDistribution: {
        zero: 0,
        low: 0,
        medium: 0,
        high: 0,
        veryHigh: 0,
      },
    };
  }
}

/**
 * Computes movement report data including total entry/exit quantities,
 * movements grouped by type, and top 5 categories.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */
export async function getMovementReportData(): Promise<MovementReportData> {
  try {
    const logHeaders = await LogHeaderRepository.find({
      relations: ['logDetails'],
    });

    let totalEntryQuantity = 0;
    let totalExitQuantity = 0;

    // Group by type and isInput
    const typeMap = new Map<
      string,
      {totalQuantity: number; isInput: boolean}
    >();

    for (const header of logHeaders) {
      const typeName =
        ALL_IN_OUT_ENUM[header.type as keyof typeof ALL_IN_OUT_ENUM] ||
        `Tipo ${header.type}`;
      const details = header.logDetails || [];

      const headerQuantity = details.reduce(
        (sum, d) => sum + d.quantity,
        0,
      );

      if (header.isInput) {
        totalEntryQuantity += headerQuantity;
      } else {
        totalExitQuantity += headerQuantity;
      }

      const key = `${typeName}_${header.isInput}`;
      const existing = typeMap.get(key);

      if (existing) {
        existing.totalQuantity += headerQuantity;
      } else {
        typeMap.set(key, {
          totalQuantity: headerQuantity,
          isInput: header.isInput,
        });
      }
    }

    const movementsByType: MovementByType[] = Array.from(
      typeMap.entries(),
    ).map(([key, value]) => ({
      typeName: key.replace(/_true$|_false$/, ''),
      totalQuantity: value.totalQuantity,
      isInput: value.isInput,
    }));

    // Sort by totalQuantity descending
    movementsByType.sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Top 5 categories by total movement quantity
    const topCategories = movementsByType.slice(0, 5);

    return {
      totalEntryQuantity,
      totalExitQuantity,
      movementsByType,
      topCategories,
    };
  } catch (error) {
    console.log('Error fetching movement report data:', error);
    return {
      totalEntryQuantity: 0,
      totalExitQuantity: 0,
      movementsByType: [],
      topCategories: [],
    };
  }
}
