import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `log_header.movementDate`: the date/time the movement actually
 * happened (sale date for outputs, receipt date for inputs). It is chosen by
 * the user and drives lists, dashboards, reports and profit. `createdAt`
 * remains the system registration timestamp (audit).
 *
 * Existing rows are backfilled with their `createdAt` so historical reports
 * keep the same numbers after the upgrade.
 */
export class AddMovementDate1700000000009 implements MigrationInterface {
  name = 'AddMovementDate1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SQLite has no "ADD COLUMN IF NOT EXISTS"; ignore duplicate-column errors
    // so the migration stays idempotent if it is retried.
    try {
      await queryRunner.query(
        `ALTER TABLE "log_header" ADD COLUMN "movementDate" datetime`,
      );
    } catch {}
    await queryRunner.query(
      `UPDATE "log_header" SET "movementDate" = "createdAt" WHERE "movementDate" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_log_header_movementDate" ON "log_header" ("movementDate")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_log_header_movementDate"`,
    );
    try {
      await queryRunner.query(
        `ALTER TABLE "log_header" DROP COLUMN "movementDate"`,
      );
    } catch {}
  }
}
