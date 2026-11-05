import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `product.sku`: an optional supplier code. Empty string means "no SKU"
 * (nitro-sqlite on Android cannot bind NULL parameters). Non-empty SKUs are
 * unique, compared case-insensitively.
 */
export class AddProductSku1700000000008 implements MigrationInterface {
  name = 'AddProductSku1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQLite has no "ADD COLUMN IF NOT EXISTS"; ignore duplicate-column errors
    // so the migration stays idempotent if it is retried.
    try {
      await queryRunner.query(
        `ALTER TABLE "product" ADD COLUMN "sku" varchar NOT NULL DEFAULT ''`,
      );
    } catch {}
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_sku" ON "product" ("sku" COLLATE NOCASE) WHERE "sku" <> ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_sku"`);
    try {
      await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "sku"`);
    } catch {}
  }
}
