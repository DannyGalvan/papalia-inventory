import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `product.isActive` so products can be enabled/disabled. Inactive
 * products are hidden from the input/output product search but keep their
 * history. Every existing product starts active.
 */
export class AddProductIsActive1700000000006 implements MigrationInterface {
  name = 'AddProductIsActive1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQLite has no "ADD COLUMN IF NOT EXISTS"; ignore duplicate-column errors
    // so the migration stays idempotent if it is retried.
    try {
      await queryRunner.query(
        `ALTER TABLE "product" ADD COLUMN "isActive" boolean NOT NULL DEFAULT 1`,
      );
    } catch {}
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_isActive" ON "product" ("isActive")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_isActive"`);
    try {
      await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "isActive"`);
    } catch {}
  }
}
