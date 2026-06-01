import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMovementTypeCatalog1700000000002 implements MigrationInterface {
  name = 'AddMovementTypeCatalog1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "movement_type" (
        "id"       integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name"     varchar NOT NULL,
        "isInput"  boolean NOT NULL,
        "isActive" boolean NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`INSERT OR IGNORE INTO "movement_type" ("id","name","isInput","isActive") VALUES (1,'Venta',0,1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "movement_type" ("id","name","isInput","isActive") VALUES (2,'Extraordinaria',0,1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "movement_type" ("id","name","isInput","isActive") VALUES (7,'Compra de inventario',1,1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "movement_type" ("id","name","isInput","isActive") VALUES (8,'Devolución',1,1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "movement_type" ("id","name","isInput","isActive") VALUES (9,'Compra extraordinaria',1,1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "movement_type" ("id","name","isInput","isActive") VALUES (10,'Otros conceptos',1,1)`);

    // Bump SQLite autoincrement past 10 so user-created types start at 11
    await queryRunner.query(`INSERT OR IGNORE INTO "movement_type" ("id","name","isInput","isActive") VALUES (11,'__seq_init__',0,0)`);
    await queryRunner.query(`DELETE FROM "movement_type" WHERE "id" = 11`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "movement_type"`);
  }
}
