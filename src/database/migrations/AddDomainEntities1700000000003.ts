import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDomainEntities1700000000003 implements MigrationInterface {
  name = 'AddDomainEntities1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_category" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar NOT NULL DEFAULT '',
        "color" varchar NOT NULL DEFAULT '#6B7280',
        "isActive" boolean NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "supplier" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "phone" varchar NOT NULL DEFAULT '',
        "email" varchar NOT NULL DEFAULT '',
        "address" varchar NOT NULL DEFAULT '',
        "notes" varchar NOT NULL DEFAULT '',
        "isActive" boolean NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "unit_of_measure" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "abbreviation" varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT 1
      )
    `);

    // SQLite does not support FK constraints in ALTER TABLE ADD COLUMN.
    // Wrapping each in try/catch to be idempotent (column may already exist on retry).
    try {
      await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "categoryId" integer`);
    } catch {}
    try {
      await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "supplierId" integer`);
    } catch {}
    try {
      await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "unitId" integer`);
    } catch {}

    await queryRunner.query(`INSERT OR IGNORE INTO "product_category" ("name","description","color","isActive") VALUES ('General','Productos sin categoría específica','#6B7280',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "product_category" ("name","description","color","isActive") VALUES ('Alimentos','Productos alimenticios','#10B981',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "product_category" ("name","description","color","isActive") VALUES ('Bebidas','Bebidas y líquidos','#3B82F6',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "product_category" ("name","description","color","isActive") VALUES ('Limpieza','Artículos de limpieza e higiene','#F59E0B',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "product_category" ("name","description","color","isActive") VALUES ('Herramientas','Herramientas y equipos','#EF4444',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "product_category" ("name","description","color","isActive") VALUES ('Papelería','Artículos de oficina y papelería','#8B5CF6',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "product_category" ("name","description","color","isActive") VALUES ('Electrónica','Dispositivos y accesorios electrónicos','#06B6D4',1)`);

    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Unidades','uds',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Kilogramos','kg',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Gramos','g',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Litros','L',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Mililitros','ml',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Cajas','caj',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Pares','par',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Metros','m',1)`);
    await queryRunner.query(`INSERT OR IGNORE INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES ('Centímetros','cm',1)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "unit_of_measure"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "supplier"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_category"`);
  }
}
