import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds logical cancellation to movements (log_header):
 *  - isCancelled: 1 once the movement was voided (stock already reverted).
 *  - cancelledAt: UTC timestamp of the cancellation (NULL while active).
 *  - cancelReason: mandatory justification captured from the user.
 * Cancelled movements stay in the history but are excluded from totals.
 */
export class AddMovementCancellation1700000000007
  implements MigrationInterface
{
  name = 'AddMovementCancellation1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statements = [
      `ALTER TABLE "log_header" ADD COLUMN "isCancelled" boolean NOT NULL DEFAULT 0`,
      `ALTER TABLE "log_header" ADD COLUMN "cancelledAt" datetime DEFAULT NULL`,
      `ALTER TABLE "log_header" ADD COLUMN "cancelReason" varchar NOT NULL DEFAULT ''`,
    ];
    // Idempotent: ignore duplicate-column errors on retry.
    for (const sql of statements) {
      try {
        await queryRunner.query(sql);
      } catch {}
    }
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_log_header_isCancelled" ON "log_header" ("isCancelled")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_log_header_isCancelled"`,
    );
    for (const column of ['cancelReason', 'cancelledAt', 'isCancelled']) {
      try {
        await queryRunner.query(
          `ALTER TABLE "log_header" DROP COLUMN "${column}"`,
        );
      } catch {}
    }
  }
}
