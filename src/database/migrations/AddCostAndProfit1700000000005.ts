import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds cost tracking for profit reports:
 *  - product.cost: current unit cost of the product.
 *  - log_detail.unitCost: unit cost snapshot taken when the movement was
 *    registered (NULL for movements created before this migration).
 *  - movement_type.isSale: marks output types that count as revenue.
 */
export class AddCostAndProfit1700000000005 implements MigrationInterface {
  name = 'AddCostAndProfit1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQLite has no "ADD COLUMN IF NOT EXISTS"; ignore duplicate-column errors
    // so the migration stays idempotent if it is retried.
    try {
      await queryRunner.query(
        `ALTER TABLE "product" ADD COLUMN "cost" decimal NOT NULL DEFAULT 0`,
      );
    } catch {}
    try {
      await queryRunner.query(
        `ALTER TABLE "log_detail" ADD COLUMN "unitCost" decimal DEFAULT NULL`,
      );
    } catch {}
    try {
      await queryRunner.query(
        `ALTER TABLE "movement_type" ADD COLUMN "isSale" boolean NOT NULL DEFAULT 0`,
      );
    } catch {}

    // The seeded "Venta" output type (id 1) is the default sale type.
    await queryRunner.query(
      `UPDATE "movement_type" SET "isSale" = 1 WHERE "id" = 1 AND "isInput" = 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite >= 3.35 supports DROP COLUMN.
    try {
      await queryRunner.query(
        `ALTER TABLE "movement_type" DROP COLUMN "isSale"`,
      );
    } catch {}
    try {
      await queryRunner.query(
        `ALTER TABLE "log_detail" DROP COLUMN "unitCost"`,
      );
    } catch {}
    try {
      await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "cost"`);
    } catch {}
  }
}
