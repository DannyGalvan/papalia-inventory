import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimezonesCatalog1700000000004 implements MigrationInterface {
  name = 'AddTimezonesCatalog1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "timezone" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "ianaName" varchar NOT NULL UNIQUE,
        "displayName" varchar NOT NULL,
        "region" varchar NOT NULL,
        "utcOffset" varchar NOT NULL,
        "isActive" boolean NOT NULL DEFAULT 1
      )
    `);

    const seeds: [string, string, string, string][] = [
      ['America/Guatemala',               'Guatemala',                   'América Central',  'UTC-06:00'],
      ['America/El_Salvador',             'El Salvador',                 'América Central',  'UTC-06:00'],
      ['America/Tegucigalpa',             'Honduras',                    'América Central',  'UTC-06:00'],
      ['America/Managua',                 'Nicaragua',                   'América Central',  'UTC-06:00'],
      ['America/Costa_Rica',              'Costa Rica',                  'América Central',  'UTC-06:00'],
      ['America/Panama',                  'Panamá',                      'América Central',  'UTC-05:00'],
      ['America/Belize',                  'Belice',                      'América Central',  'UTC-06:00'],
      ['America/Mexico_City',             'Ciudad de México',             'México',           'UTC-06:00'],
      ['America/Monterrey',               'Monterrey',                   'México',           'UTC-06:00'],
      ['America/Cancun',                  'Cancún',                      'México',           'UTC-05:00'],
      ['America/Tijuana',                 'Tijuana',                     'México',           'UTC-08:00'],
      ['America/Hermosillo',              'Hermosillo',                  'México',           'UTC-07:00'],
      ['America/New_York',                'Nueva York (EST)',             'América del Norte','UTC-05:00'],
      ['America/Chicago',                 'Chicago (CST)',                'América del Norte','UTC-06:00'],
      ['America/Denver',                  'Denver (MST)',                 'América del Norte','UTC-07:00'],
      ['America/Los_Angeles',             'Los Ángeles (PST)',            'América del Norte','UTC-08:00'],
      ['America/Phoenix',                 'Phoenix',                     'América del Norte','UTC-07:00'],
      ['America/Anchorage',               'Alaska',                      'América del Norte','UTC-09:00'],
      ['Pacific/Honolulu',                'Hawái',                       'América del Norte','UTC-10:00'],
      ['America/Toronto',                 'Toronto',                     'América del Norte','UTC-05:00'],
      ['America/Vancouver',               'Vancouver',                   'América del Norte','UTC-08:00'],
      ['America/Havana',                  'Cuba',                        'América del Norte','UTC-05:00'],
      ['America/Santo_Domingo',           'República Dominicana',        'Caribe',           'UTC-04:00'],
      ['America/Puerto_Rico',             'Puerto Rico',                 'Caribe',           'UTC-04:00'],
      ['America/Bogota',                  'Colombia',                    'América del Sur',  'UTC-05:00'],
      ['America/Lima',                    'Perú',                        'América del Sur',  'UTC-05:00'],
      ['America/Caracas',                 'Venezuela',                   'América del Sur',  'UTC-04:00'],
      ['America/La_Paz',                  'Bolivia',                     'América del Sur',  'UTC-04:00'],
      ['America/Santiago',                'Chile',                       'América del Sur',  'UTC-04:00'],
      ['America/Asuncion',                'Paraguay',                    'América del Sur',  'UTC-04:00'],
      ['America/Argentina/Buenos_Aires',  'Argentina',                   'América del Sur',  'UTC-03:00'],
      ['America/Montevideo',              'Uruguay',                     'América del Sur',  'UTC-03:00'],
      ['America/Sao_Paulo',               'Brasil (São Paulo)',           'América del Sur',  'UTC-03:00'],
      ['America/Manaus',                  'Brasil (Manaos)',              'América del Sur',  'UTC-04:00'],
      ['America/Fortaleza',               'Brasil (Nordeste)',            'América del Sur',  'UTC-03:00'],
      ['America/Guayaquil',               'Ecuador',                     'América del Sur',  'UTC-05:00'],
      ['UTC',                             'UTC (Tiempo Universal)',       'Mundial',          'UTC+00:00'],
      ['Europe/London',                   'Londres (GMT)',                'Europa',           'UTC+00:00'],
      ['Europe/Madrid',                   'España',                      'Europa',           'UTC+01:00'],
      ['Europe/Paris',                    'Francia',                     'Europa',           'UTC+01:00'],
      ['Europe/Berlin',                   'Alemania',                    'Europa',           'UTC+01:00'],
      ['Europe/Rome',                     'Italia',                      'Europa',           'UTC+01:00'],
      ['Europe/Athens',                   'Grecia',                      'Europa',           'UTC+02:00'],
      ['Europe/Moscow',                   'Rusia (Moscú)',                'Europa',           'UTC+03:00'],
      ['Asia/Dubai',                      'Emiratos Árabes',             'Asia',             'UTC+04:00'],
      ['Asia/Kolkata',                    'India',                       'Asia',             'UTC+05:30'],
      ['Asia/Bangkok',                    'Tailandia',                   'Asia',             'UTC+07:00'],
      ['Asia/Shanghai',                   'China',                       'Asia',             'UTC+08:00'],
      ['Asia/Tokyo',                      'Japón',                       'Asia',             'UTC+09:00'],
      ['Australia/Sydney',                'Australia (Sydney)',           'Pacífico',         'UTC+10:00'],
      ['Pacific/Auckland',                'Nueva Zelanda',               'Pacífico',         'UTC+12:00'],
    ];

    for (const [ianaName, displayName, region, utcOffset] of seeds) {
      await queryRunner.query(
        `INSERT OR IGNORE INTO "timezone" ("ianaName","displayName","region","utcOffset","isActive") VALUES (?,?,?,?,1)`,
        [ianaName, displayName, region, utcOffset],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "timezone"`);
  }
}
