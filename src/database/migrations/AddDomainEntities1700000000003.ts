import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDomainEntities1700000000003 implements MigrationInterface {
  name = 'AddDomainEntities1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "product_category" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar NOT NULL DEFAULT '',
        "color" varchar NOT NULL DEFAULT '#6B7280',
        "isActive" boolean NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "supplier" (
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
      CREATE TABLE "unit_of_measure" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "abbreviation" varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "categoryId" integer REFERENCES "product_category"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "supplierId" integer REFERENCES "supplier"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "product" ADD COLUMN "unitId" integer REFERENCES "unit_of_measure"("id") ON DELETE SET NULL`);

    // Seed categories
    await queryRunner.query(`
      INSERT INTO "product_category" ("name","description","color","isActive") VALUES
        ('General','Productos sin categoría específica','#6B7280',1),
        ('Alimentos','Productos alimenticios','#10B981',1),
        ('Bebidas','Bebidas y líquidos','#3B82F6',1),
        ('Limpieza','Artículos de limpieza e higiene','#F59E0B',1),
        ('Herramientas','Herramientas y equipos','#EF4444',1),
        ('Papelería','Artículos de oficina y papelería','#8B5CF6',1),
        ('Electrónica','Dispositivos y accesorios electrónicos','#06B6D4',1)
    `);

    // Seed units of measure
    await queryRunner.query(`
      INSERT INTO "unit_of_measure" ("name","abbreviation","isActive") VALUES
        ('Unidades','uds',1),
        ('Kilogramos','kg',1),
        ('Gramos','g',1),
        ('Litros','L',1),
        ('Mililitros','ml',1),
        ('Cajas','caj',1),
        ('Pares','par',1),
        ('Metros','m',1),
        ('Centímetros','cm',1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "unitId"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "supplierId"`);
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "categoryId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "unit_of_measure"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "supplier"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_category"`);
  }
}
