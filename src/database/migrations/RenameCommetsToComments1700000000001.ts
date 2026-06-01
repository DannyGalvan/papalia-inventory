import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameCommetsToComments1700000000001
  implements MigrationInterface
{
  name = 'RenameCommetsToComments1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column is already named "comments" (migration already ran
    // or table was created fresh with the correct name).
    const tableInfo: Array<{name: string}> = await queryRunner.query(
      `PRAGMA table_info("log_header")`,
    );
    const hasCommets = tableInfo.some(col => col.name === 'commets');

    if (!hasCommets) {
      // Column is already "comments" — nothing to do.
      return;
    }

    // SQLite ≥ 3.25 supports RENAME COLUMN, but older versions don't.
    // Use the safe recreate-table approach for maximum compatibility.
    await queryRunner.query(`
      CREATE TABLE "log_header_new" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "type" integer NOT NULL,
        "comments" varchar NOT NULL,
        "createdAt" datetime NOT NULL,
        "isInput" boolean NOT NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "log_header_new" ("id", "type", "comments", "createdAt", "isInput")
      SELECT "id", "type", "commets", "createdAt", "isInput"
      FROM "log_header"
    `);

    await queryRunner.query(`DROP TABLE "log_header"`);

    await queryRunner.query(
      `ALTER TABLE "log_header_new" RENAME TO "log_header"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableInfo: Array<{name: string}> = await queryRunner.query(
      `PRAGMA table_info("log_header")`,
    );
    const hasComments = tableInfo.some(col => col.name === 'comments');

    if (!hasComments) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "log_header_old" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "type" integer NOT NULL,
        "commets" varchar NOT NULL,
        "createdAt" datetime NOT NULL,
        "isInput" boolean NOT NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "log_header_old" ("id", "type", "commets", "createdAt", "isInput")
      SELECT "id", "type", "comments", "createdAt", "isInput"
      FROM "log_header"
    `);

    await queryRunner.query(`DROP TABLE "log_header"`);

    await queryRunner.query(
      `ALTER TABLE "log_header_old" RENAME TO "log_header"`,
    );
  }
}
