import {
  MovementCancellationStore,
  MovementCancellationTx,
  MovementSnapshot,
  StockAdjustment,
} from '../../services/movement/types';
import { toBool, toNumber, toText } from '../utils/nitroValues';
import {
  SqlExecutor,
  TransactionalSqlExecutor,
  toSqliteUtcDatetime,
} from '../utils/sqlExecutor';

/**
 * Raw-SQL implementation of the cancellation persistence port.
 * Every value is bound as string/number (never boolean/null) because
 * nitro-sqlite on Android mis-binds those types.
 */
class SqlCancellationTx implements MovementCancellationTx {
  constructor(private readonly sql: SqlExecutor) {}

  async findMovement(id: number): Promise<MovementSnapshot | null> {
    const headers = await this.sql.query(
      'SELECT "id", "isInput", "isCancelled" FROM "log_header" WHERE "id" = ?',
      [id],
    );
    const header = headers[0];
    if (!header) {
      return null;
    }
    const lines = await this.sql.query(
      'SELECT "productCode", "name", "quantity" FROM "log_detail" WHERE "logHeaderId" = ?',
      [id],
    );
    return {
      id: toNumber(header.id),
      isInput: toBool(header.isInput),
      isCancelled: toBool(header.isCancelled),
      lines: lines.map(row => ({
        productCode: toText(row.productCode),
        name: toText(row.name),
        quantity: toNumber(row.quantity),
      })),
    };
  }

  async getStocks(codes: string[]): Promise<Map<string, number>> {
    const unique = Array.from(new Set(codes));
    const stocks = new Map<string, number>();
    if (unique.length === 0) {
      return stocks;
    }
    const placeholders = unique.map(() => '?').join(', ');
    const rows = await this.sql.query(
      `SELECT "code", "stock" FROM "product" WHERE "code" IN (${placeholders})`,
      unique,
    );
    for (const row of rows) {
      stocks.set(toText(row.code), toNumber(row.stock));
    }
    return stocks;
  }

  async adjustStock({ productCode, delta }: StockAdjustment): Promise<void> {
    // Relative update: never overwrites concurrent stock changes.
    await this.sql.query(
      'UPDATE "product" SET "stock" = "stock" + ? WHERE "code" = ?',
      [delta, productCode],
    );
  }

  async markCancelled(id: number, reason: string, at: Date): Promise<void> {
    await this.sql.query(
      'UPDATE "log_header" SET "isCancelled" = 1, "cancelledAt" = ?, "cancelReason" = ? WHERE "id" = ? AND "isCancelled" = 0',
      [toSqliteUtcDatetime(at), reason, id],
    );
  }
}

export class SqlMovementCancellationStore implements MovementCancellationStore {
  constructor(private readonly executor: TransactionalSqlExecutor) {}

  runInTransaction<T>(
    work: (tx: MovementCancellationTx) => Promise<T>,
  ): Promise<T> {
    return this.executor.transaction(sql => work(new SqlCancellationTx(sql)));
  }
}
