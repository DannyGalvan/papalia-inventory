import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitPapaliaSchema1700000000000 implements MigrationInterface {
  name = 'InitPapaliaSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla product
    await queryRunner.query(`
      CREATE TABLE "product" (
        "code" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "description" varchar NOT NULL,
        "price" decimal NOT NULL,
        "stock" integer NOT NULL,
        "image" varchar NOT NULL DEFAULT ''
      )
    `);

    // Tabla log_header
    await queryRunner.query(`
      CREATE TABLE "log_header" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "type" integer NOT NULL,
        "commets" varchar NOT NULL,
        "createdAt" datetime NOT NULL,
        "isInput" boolean NOT NULL
      )
    `);

    // Tabla configuration
    await queryRunner.query(`
      CREATE TABLE "configuration" (
        "key" varchar PRIMARY KEY NOT NULL,
        "value" varchar NOT NULL
      )
    `);

    // Tabla log_detail (con llaves foráneas)
    await queryRunner.query(`
      CREATE TABLE "log_detail" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "productCode" varchar NOT NULL,
        "logHeaderId" integer NOT NULL,
        "name" varchar NOT NULL,
        "quantity" integer NOT NULL,
        "price" decimal NOT NULL,
        "total" decimal NOT NULL,
        CONSTRAINT "FK_log_detail_log_header"
          FOREIGN KEY ("logHeaderId") REFERENCES "log_header" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_log_detail_product"
          FOREIGN KEY ("productCode") REFERENCES "product" ("code")
          ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // El orden importa por las FKs
    await queryRunner.query(`DROP TABLE IF EXISTS "log_detail"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "configuration"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "log_header"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product"`);
  }
}
