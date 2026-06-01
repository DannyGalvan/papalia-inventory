/**
 * Property-based tests for the Excel import/export service (exceljs backed).
 *
 * Feature: app-modernization
 *   Property 5: Excel export/import round-trip preserves product data — for any
 *               valid array of Product records (non-empty code/name, string
 *               description/image, numeric price, integer stock), exporting to
 *               XLSX and then importing from that XLSX must produce an
 *               equivalent array of Product records with matching field values.
 *               The exported workbook must contain a sheet named "Productos"
 *               (and exportLogs produces "Entradas"/"Salidas") with columns
 *               matching the respective model fields.
 *
 * Validates: Requirements 5.2, 5.3
 *
 * The native file system is replaced by an in-memory map so that what
 * `exportProducts` serializes (base64 written via FileService) is captured and
 * fed straight back into `importProducts` (which reads base64 and parses it
 * with exceljs). This exercises the genuine workbook serialize/parse round-trip
 * in the Jest/Node environment without any native module.
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 */

import fc from 'fast-check';

// ---------------------------------------------------------------------------
// In-memory mock of the native file system used by FileService/ExcelService.
// `mockFsStore` (the `mock` prefix lets jest reference it inside the factory)
// maps an absolute path to its base64 file content. writeFile stores it,
// readFile returns it, exists reports presence. This makes export -> import a
// real in-memory round-trip through exceljs.
// ---------------------------------------------------------------------------

const mockFsStore = new Map<string, string>();

// TypeORM's data models are imported transitively (via ExcelService) and
// directly (LogHeader/LogDetail/Product) in this test. TypeORM resolves to its
// ESM `browser` build under Jest, which Jest cannot transpile cleanly. The
// models only use TypeORM's decorators at runtime, so replace the module with
// no-op decorator factories — the decorators have no bearing on the Excel
// serialize/parse logic under test.
jest.mock('typeorm', () => {
  const noopDecorator =
    () =>
    (..._args: unknown[]): void => {};
  const decoratorFactory =
    (..._factoryArgs: unknown[]) =>
    (..._args: unknown[]): void => {};
  return {
    Entity: decoratorFactory,
    Column: decoratorFactory,
    PrimaryColumn: decoratorFactory,
    PrimaryGeneratedColumn: decoratorFactory,
    OneToMany: decoratorFactory,
    ManyToOne: decoratorFactory,
    JoinColumn: decoratorFactory,
    CreateDateColumn: decoratorFactory,
    UpdateDateColumn: decoratorFactory,
    Index: decoratorFactory,
    Unique: decoratorFactory,
    Generated: noopDecorator,
  };
});

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DownloadDirectoryPath: '/mock/Download',
  DocumentDirectoryPath: '/mock/Documents',
  writeFile: jest.fn(async (path: string, content: string) => {
    mockFsStore.set(path, content);
  }),
  readFile: jest.fn(async (path: string) => {
    if (!mockFsStore.has(path)) {
      throw new Error(`ENOENT: no such file: ${path}`);
    }
    return mockFsStore.get(path);
  }),
  exists: jest.fn(async (path: string) => mockFsStore.has(path)),
}));

// Imports must come after jest.mock so the mocked module is wired in.
import ExcelJS from 'exceljs';
import { LogDetail } from '../../../src/database/models/LogDetail';
import { LogHeader } from '../../../src/database/models/LogHeader';
import { Product } from '../../../src/database/models/Product';
import {
    excelService,
    INPUTS_SHEET_NAME,
    OUTPUTS_SHEET_NAME,
    PRODUCT_COLUMNS,
    PRODUCTS_SHEET_NAME,
} from '../../../src/services/ExcelService';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Characters that round-trip cleanly through the XLSX (XML) format. Excludes
 * XML-invalid control characters and characters that exceljs could interpret
 * specially, while still covering Spanish accents and common punctuation so
 * the generated data resembles real warehouse content.
 */
const SAFE_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 áéíóúñüÁÉÍÓÚÑÜ.,-_#()/'.split(
    '',
  );

/** A string of safe characters within the given length bounds. */
const safeString = (minLength: number, maxLength: number): fc.Arbitrary<string> =>
  fc
    .array(fc.constantFrom(...SAFE_CHARS), { minLength, maxLength })
    .map(chars => chars.join(''));

/**
 * Non-empty code/name: at least one non-space character so the value survives
 * as a populated cell and is never treated as an empty cell on import.
 */
const requiredString = (maxLength: number): fc.Arbitrary<string> =>
  safeString(1, maxLength).filter(s => s.trim().length > 0);

/** Price with at most 2 decimals (currency-like, finite, non-negative). */
const priceArbitrary: fc.Arbitrary<number> = fc
  .integer({ min: 0, max: 100_000_000 })
  .map(cents => cents / 100);

/** Stock: a non-negative integer. */
const stockArbitrary: fc.Arbitrary<number> = fc.integer({ min: 0, max: 1_000_000 });

/** A single valid Product. */
const productArbitrary: fc.Arbitrary<Product> = fc
  .record({
    code: requiredString(24),
    name: requiredString(40),
    description: safeString(0, 60),
    price: priceArbitrary,
    stock: stockArbitrary,
    image: safeString(0, 30),
  })
  .map(fields => {
    const product = new Product();
    product.code = fields.code;
    product.name = fields.name;
    product.description = fields.description;
    product.price = fields.price;
    product.stock = fields.stock;
    product.image = fields.image;
    return product;
  });

/** A non-empty array of products. */
const productArrayArbitrary: fc.Arbitrary<Product[]> = fc.array(productArbitrary, {
  minLength: 1,
  maxLength: 15,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Assert that the imported products are field-equivalent to the originals.
 * String fields compare exactly (import coerces via String); numeric fields
 * compare with a 2-decimal tolerance (import coerces via Number).
 */
function expectEquivalentProducts(
  original: Product[],
  imported: Product[],
): void {
  expect(imported).toHaveLength(original.length);
  original.forEach((expected, index) => {
    const actual = imported[index];
    expect(actual.code).toBe(expected.code);
    expect(actual.name).toBe(expected.name);
    expect(actual.description).toBe(expected.description);
    expect(actual.image).toBe(expected.image);
    expect(typeof actual.price).toBe('number');
    expect(typeof actual.stock).toBe('number');
    expect(actual.price).toBeCloseTo(expected.price, 2);
    expect(actual.stock).toBe(expected.stock);
  });
}

/** Load the captured workbook for `filePath` from the in-memory store. */
async function loadWorkbookFromStore(filePath: string): Promise<ExcelJS.Workbook> {
  const base64 = mockFsStore.get(filePath);
  expect(base64).toBeDefined();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(base64 as string, 'base64') as any);
  return workbook;
}

// ---------------------------------------------------------------------------
// Anchor unit tests (concrete examples)
// ---------------------------------------------------------------------------

describe('ExcelService — round-trip examples', () => {
  beforeEach(() => {
    mockFsStore.clear();
  });

  it('preserves a simple product list through export then import', async () => {
    const build = (
      code: string,
      name: string,
      description: string,
      price: number,
      stock: number,
      image: string,
    ): Product => {
      const p = new Product();
      p.code = code;
      p.name = name;
      p.description = description;
      p.price = price;
      p.stock = stock;
      p.image = image;
      return p;
    };

    const products = [
      build('A-001', 'Tornillo', 'Caja de 100', 12.5, 30, 'tornillo.png'),
      build('B-002', 'Martillo', 'Mango de madera', 199.99, 0, ''),
    ];

    const filePath = await excelService.exportProducts(products);
    const imported = await excelService.importProducts(filePath);

    expectEquivalentProducts(products, imported);
  });

  it('preserves empty description and image as empty strings', async () => {
    const p = new Product();
    p.code = 'C-003';
    p.name = 'Clavo';
    p.description = '';
    p.price = 0;
    p.stock = 5;
    p.image = '';

    const filePath = await excelService.exportProducts([p]);
    const imported = await excelService.importProducts(filePath);

    expect(imported).toHaveLength(1);
    expect(imported[0].description).toBe('');
    expect(imported[0].image).toBe('');
  });

  it('preserves numeric-looking string codes as strings', async () => {
    const p = new Product();
    p.code = '0012345';
    p.name = 'Pintura';
    p.description = 'Blanca';
    p.price = 75.25;
    p.stock = 12;
    p.image = '';

    const filePath = await excelService.exportProducts([p]);
    const imported = await excelService.importProducts(filePath);

    expect(imported[0].code).toBe('0012345');
    expect(imported[0].price).toBeCloseTo(75.25, 2);
  });

  it('writes a workbook containing the "Productos" sheet with model columns', async () => {
    const p = new Product();
    p.code = 'D-004';
    p.name = 'Lija';
    p.description = 'Grano fino';
    p.price = 9.9;
    p.stock = 100;
    p.image = '';

    const filePath = await excelService.exportProducts([p]);
    const workbook = await loadWorkbookFromStore(filePath);

    const sheet = workbook.getWorksheet(PRODUCTS_SHEET_NAME);
    expect(sheet).toBeDefined();

    const headerRow = (sheet as ExcelJS.Worksheet).getRow(1);
    const headers = PRODUCT_COLUMNS.map((_, i) => headerRow.getCell(i + 1).value);
    expect(headers).toEqual([...PRODUCT_COLUMNS]);
  });

  it('names the log sheet "Entradas" for inputs and "Salidas" for outputs', async () => {
    const header = new LogHeader();
    header.id = 1;
    header.type = 7;
    header.comments = 'Compra';
    header.createdAt = new Date('2024-01-01T00:00:00.000Z');
    header.isInput = true;

    const detail = new LogDetail();
    detail.id = 1;
    detail.productCode = 'A-001';
    detail.logHeaderId = 1;
    detail.name = 'Tornillo';
    detail.quantity = 10;
    detail.price = 12.5;
    detail.total = 125;

    const inputPath = await excelService.exportLogs([header], [detail], true);
    const inputWorkbook = await loadWorkbookFromStore(inputPath);
    expect(inputWorkbook.getWorksheet(INPUTS_SHEET_NAME)).toBeDefined();

    const outHeader = new LogHeader();
    outHeader.id = 2;
    outHeader.type = 1;
    outHeader.comments = 'Venta';
    outHeader.createdAt = new Date('2024-01-02T00:00:00.000Z');
    outHeader.isInput = false;

    const outDetail = new LogDetail();
    outDetail.id = 2;
    outDetail.productCode = 'B-002';
    outDetail.logHeaderId = 2;
    outDetail.name = 'Martillo';
    outDetail.quantity = 1;
    outDetail.price = 199.99;
    outDetail.total = 199.99;

    const outputPath = await excelService.exportLogs([outHeader], [outDetail], false);
    const outputWorkbook = await loadWorkbookFromStore(outputPath);
    expect(outputWorkbook.getWorksheet(OUTPUTS_SHEET_NAME)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Property 5: Excel export/import round-trip preserves product data
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 5: Excel export/import round-trip preserves product data', () => {
  it('exporting then importing any valid product array yields equivalent records in a "Productos" sheet', async () => {
    await fc.assert(
      fc.asyncProperty(productArrayArbitrary, async products => {
        // Start each run from a clean file system so paths never collide.
        mockFsStore.clear();

        const filePath = await excelService.exportProducts(products);

        // The exported workbook must carry the "Productos" sheet.
        const workbook = await loadWorkbookFromStore(filePath);
        expect(workbook.getWorksheet(PRODUCTS_SHEET_NAME)).toBeDefined();

        // Round-trip: import back and compare field-by-field.
        const imported = await excelService.importProducts(filePath);
        expectEquivalentProducts(products, imported);
      }),
      { numRuns: 100 },
    );
  });
});
