/**
 * Excel import/export service backed by `exceljs`.
 *
 * This service replaces the previous `xlsx` (SheetJS 0.20.3) dependency, which
 * carried HIGH severity vulnerabilities, with `exceljs`, which reports no
 * HIGH/CRITICAL advisories (Requirement 5.1). It preserves the exact workbook
 * structure produced by the old implementation so that exported files remain
 * equivalent (Requirements 5.2, 5.3, 5.5):
 *
 *  - `exportProducts` writes a single sheet named **"Productos"** with the
 *    columns `code, sku, name, description, price, cost, stock, image` (the `Product`
 *    model fields, in model order), to `Productos_<uuid>.xlsx`.
 *  - `exportLogs` writes a single sheet named **"Entradas"** (inputs) or
 *    **"Salidas"** (outputs) with the joined header/detail columns
 *    `id, Codigo, tipo, creado, fechaMovimiento, observaciones, cantidad,
 *    esEntrada, nombre, precio, total, estado, motivoCancelacion`
 *    (`creado` = registration date, `fechaMovimiento` = sale/receipt date), to `Ingresos_<uuid>.xlsx` (inputs) or
 *    `Salidas_<uuid>.xlsx` (outputs) — matching the legacy file naming.
 *  - `importProducts` reads the first worksheet of a workbook and maps each row
 *    back into a `Product` using the same field mapping
 *    (`code, sku, name, description, price, cost, stock, image`).
 *
 * Path resolution and file writing are delegated to {@link fileService} so the
 * platform-appropriate downloads directory is used and the written file is
 * verified to exist before success is reported (Requirement 6.3). Reading for
 * import uses the same native file system library, decoding the file from
 * base64 into the binary buffer that `exceljs` consumes.
 *
 * A singleton instance ({@link excelService}) is exported for shared use.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

import { readFile as rnfsReadFile } from '@dr.pogodin/react-native-fs';
import { toFsPath } from '../utils/filePaths';
import ExcelJS from 'exceljs';
import uuid from 'react-native-uuid';
import { ALL_IN_OUT_ENUM, INPUT_ENUM } from '../config/constants';
import { LogDetail } from '../database/models/LogDetail';
import { LogHeader } from '../database/models/LogHeader';
import { Product } from '../database/models/Product';
import { fileService } from './FileService';
import { effectiveMovementDate } from './movement/movementDate';
import { logService } from './LogService';

/** Sheet name used for the products export (preserved from the xlsx version). */
export const PRODUCTS_SHEET_NAME = 'Productos';
/** Sheet name used for the inputs export (preserved from the xlsx version). */
export const INPUTS_SHEET_NAME = 'Entradas';
/** Sheet name used for the outputs export (preserved from the xlsx version). */
export const OUTPUTS_SHEET_NAME = 'Salidas';

/**
 * Column keys for the products sheet, in `Product` model order. These double as
 * the header labels, matching the keys that the legacy `json_to_sheet` produced
 * from the `Product` entity (Requirement 5.2).
 */
export const PRODUCT_COLUMNS = [
  'code',
  'sku',
  'name',
  'description',
  'price',
  'cost',
  'stock',
  'image',
] as const;

interface RangeValidations {
  dataValidations: {
    add(range: string, validation: ExcelJS.DataValidation): void;
  };
}

type ProductColumn = (typeof PRODUCT_COLUMNS)[number];

/** Name of the instructions sheet in the bulk-upload template. */
export const TEMPLATE_HELP_SHEET_NAME = 'Instrucciones';

/** Rows of the template that carry Excel data validation. */
const TEMPLATE_VALIDATED_ROWS = 1000;

/** Per-column guidance shown in the template header notes and help sheet. */
const TEMPLATE_COLUMN_HELP: Record<
  ProductColumn,
  { required: boolean; description: string; example: string; width: number }
> = {
  code: {
    required: false,
    description:
      'Déjalo vacío para que la app genere el código automáticamente (PRD-000001, PRD-000002…). Si lo llenas, no debe repetirse ni existir ya en la app.',
    example: '',
    width: 14,
  },
  sku: {
    required: false,
    description:
      'Código del producto según el proveedor (SKU). Opcional; si se llena no debe repetirse.',
    example: 'ABC-123',
    width: 16,
  },
  name: {
    required: true,
    description: 'Nombre del producto.',
    example: 'Café molido 500 g',
    width: 28,
  },
  description: {
    required: true,
    description: 'Descripción breve del producto.',
    example: 'Bolsa de café tostado',
    width: 34,
  },
  price: {
    required: true,
    description:
      'Precio de venta unitario. Número mayor a 0, sin símbolo de moneda.',
    example: '45.50',
    width: 12,
  },
  cost: {
    required: false,
    description:
      'Costo unitario de compra. Número mayor o igual a 0; si se deja vacío se guarda 0.',
    example: '30.00',
    width: 12,
  },
  stock: {
    required: true,
    description: 'Existencia inicial. Número entero mayor o igual a 0.',
    example: '20',
    width: 10,
  },
  image: {
    required: false,
    description: 'Dejar vacío; la imagen se agrega desde la app.',
    example: '',
    width: 12,
  },
};

const TEMPLATE_TIPS = [
  'Llena los productos en la hoja "Productos", una fila por producto, empezando en la fila 2.',
  'No cambies, muevas ni borres los encabezados de la fila 1.',
  'No agregues filas de totales ni notas en la hoja "Productos".',
  'Usa punto como separador decimal y no incluyas el símbolo de moneda.',
  'Guarda el archivo como .xlsx e impórtalo desde "Crear producto" con el botón de importar.',
];

/**
 * Column keys for the log sheets, matching the `LogDetailResponse` shape the
 * legacy export built before serialization (Requirement 5.2).
 */
export const LOG_COLUMNS = [
  'id',
  'Codigo',
  'tipo',
  'creado',
  'fechaMovimiento',
  'observaciones',
  'cantidad',
  'esEntrada',
  'nombre',
  'precio',
  'total',
  'estado',
  'motivoCancelacion',
] as const;

/** Contract for Excel import/export operations. */
export interface ExcelService {
  /**
   * Export the given products to an XLSX file in the downloads directory.
   * Returns the absolute path of the written file.
   */
  exportProducts(products: Product[]): Promise<string>;
  /**
   * Write an empty bulk-upload template (`Plantilla_Productos.xlsx`): a
   * "Productos" sheet with the import headers and an "Instrucciones" sheet.
   * Returns the absolute path of the written file.
   */
  exportProductTemplate(): Promise<string>;
  /**
   * Export the given log headers and details to an XLSX file. When `isInput`
   * is `true` the sheet is named "Entradas" and the file `Ingresos_*.xlsx`;
   * otherwise the sheet is "Salidas" and the file `Salidas_*.xlsx`.
   * Returns the absolute path of the written file.
   */
  exportLogs(
    headers: LogHeader[],
    details: LogDetail[],
    isInput: boolean,
  ): Promise<string>;
  /**
   * Parse the first worksheet of the XLSX file at `filePath` into `Product`
   * records using the `code, sku, name, description, price, cost, stock, image` mapping.
   */
  importProducts(filePath: string): Promise<Product[]>;
}

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Encode a byte array to a base64 string using a pure-JS implementation so the
 * service does not depend on a global `Buffer`/`btoa` being present in the
 * React Native runtime.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    // 24-bit group split into four 6-bit indexes (arithmetic, no bitwise ops).
    const triplet = b0 * 65536 + b1 * 256 + b2;

    output += BASE64_ALPHABET[Math.floor(triplet / 262144) % 64];
    output += BASE64_ALPHABET[Math.floor(triplet / 4096) % 64];
    output +=
      i + 1 < bytes.length
        ? BASE64_ALPHABET[Math.floor(triplet / 64) % 64]
        : '=';
    output += i + 2 < bytes.length ? BASE64_ALPHABET[triplet % 64] : '=';
  }
  return output;
}

/**
 * Decode a base64 string into a byte array (pure-JS, runtime-agnostic).
 */
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const length = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(length);

  let byteIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e0 = BASE64_ALPHABET.indexOf(clean[i]);
    const e1 = BASE64_ALPHABET.indexOf(clean[i + 1]);
    const e2 = BASE64_ALPHABET.indexOf(clean[i + 2]);
    const e3 = BASE64_ALPHABET.indexOf(clean[i + 3]);

    // Rebuild the 24-bit group from four 6-bit values, then split into bytes.
    const triplet =
      e0 * 262144 + e1 * 4096 + (e2 < 0 ? 0 : e2) * 64 + (e3 < 0 ? 0 : e3);

    if (byteIndex < length)
      bytes[byteIndex++] = Math.floor(triplet / 65536) % 256;
    if (byteIndex < length)
      bytes[byteIndex++] = Math.floor(triplet / 256) % 256;
    if (byteIndex < length) bytes[byteIndex++] = triplet % 256;
  }
  return bytes;
}

/**
 * Reduce an exceljs cell value to a primitive. Cells written by this service
 * hold primitives (string/number/boolean/Date), but exceljs may surface rich
 * text, hyperlink or formula objects when reading arbitrary files, so unwrap
 * those defensively.
 */
function unwrapCellValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if ('text' in v) return v.text;
    if ('result' in v) return v.result;
    if ('richText' in v && Array.isArray(v.richText)) {
      return (v.richText as Array<{ text?: string }>)
        .map(part => part.text ?? '')
        .join('');
    }
    if ('hyperlink' in v) return v.hyperlink;
  }
  return value;
}

/** Default implementation of {@link ExcelService} backed by exceljs. */
export class ExcelServiceImpl implements ExcelService {
  async exportProducts(products: Product[]): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(PRODUCTS_SHEET_NAME);

    sheet.columns = PRODUCT_COLUMNS.map(key => ({ header: key, key }));

    for (const product of products) {
      sheet.addRow({
        code: product.code,
        sku: product.sku ?? '',
        name: product.name,
        description: product.description,
        price: product.price,
        cost: Number(product.cost) || 0,
        stock: product.stock,
        image: product.image ?? '',
      });
    }

    return this.writeWorkbook(workbook, `Productos_${uuid.v4()}.xlsx`);
  }

  async exportProductTemplate(): Promise<string> {
    const workbook = new ExcelJS.Workbook();

    // Data sheet first: importProducts reads the first worksheet.
    const sheet = workbook.addWorksheet(PRODUCTS_SHEET_NAME, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    sheet.columns = PRODUCT_COLUMNS.map(key => ({
      header: key,
      key,
      width: TEMPLATE_COLUMN_HELP[key].width,
    }));
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0688B1' },
      };
      const help = TEMPLATE_COLUMN_HELP[String(cell.value) as ProductColumn];
      cell.note = `${help.required ? 'Obligatorio' : 'Opcional'}. ${
        help.description
      } Ej.: ${help.example}`;
    });

    // Reject negative / non-numeric values directly in Excel. Range-based
    // validations exist at runtime but are missing from exceljs' typings;
    // unlike per-cell validation they do not create empty rows.
    const validations = (sheet as unknown as RangeValidations).dataValidations;
    const lastRow = TEMPLATE_VALIDATED_ROWS + 1;
    const columnLetter = (key: ProductColumn) =>
      String.fromCharCode(65 + PRODUCT_COLUMNS.indexOf(key));
    for (const key of ['price', 'cost'] as const) {
      const col = columnLetter(key);
      validations.add(`${col}2:${col}${lastRow}`, {
        type: 'decimal',
        operator: 'greaterThanOrEqual',
        formulae: [0],
        allowBlank: key === 'cost',
        showErrorMessage: true,
        errorTitle: 'Valor inválido',
        error: 'Ingresa un número mayor o igual a 0.',
      });
    }
    const stockCol = columnLetter('stock');
    validations.add(`${stockCol}2:${stockCol}${lastRow}`, {
      type: 'whole',
      operator: 'greaterThanOrEqual',
      formulae: [0],
      allowBlank: false,
      showErrorMessage: true,
      errorTitle: 'Valor inválido',
      error: 'Ingresa un número entero mayor o igual a 0.',
    });

    const help = workbook.addWorksheet(TEMPLATE_HELP_SHEET_NAME);
    help.columns = [
      { header: 'Columna', key: 'column', width: 14 },
      { header: 'Obligatorio', key: 'required', width: 12 },
      { header: 'Descripción', key: 'description', width: 60 },
      { header: 'Ejemplo', key: 'example', width: 22 },
    ];
    help.getRow(1).font = { bold: true };
    for (const key of PRODUCT_COLUMNS) {
      const h = TEMPLATE_COLUMN_HELP[key];
      help.addRow({
        column: key,
        required: h.required ? 'Sí' : 'No',
        description: h.description,
        example: h.example,
      });
    }
    help.addRow({});
    for (const tip of TEMPLATE_TIPS) {
      help.addRow({ column: '•', description: tip });
    }
    help.getColumn('description').alignment = { wrapText: true };

    return this.writeWorkbook(workbook, 'Plantilla_Productos.xlsx');
  }

  async exportLogs(
    headers: LogHeader[],
    details: LogDetail[],
    isInput: boolean,
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const sheetName = isInput ? INPUTS_SHEET_NAME : OUTPUTS_SHEET_NAME;
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = LOG_COLUMNS.map(key => ({ header: key, key }));

    // Index headers by id for an efficient join with their details.
    const headersById = new Map<number, LogHeader>();
    for (const header of headers) {
      headersById.set(header.id, header);
    }

    // Type label source mirrors the legacy mapping: inputs used INPUT_ENUM,
    // outputs used ALL_IN_OUT_ENUM.
    const typeEnum: Record<number, string> = isInput
      ? (INPUT_ENUM as Record<number, string>)
      : (ALL_IN_OUT_ENUM as Record<number, string>);

    for (const detail of details) {
      const header = headersById.get(detail.logHeaderId);
      if (!header) {
        continue;
      }

      sheet.addRow({
        id: detail.id,
        Codigo: detail.productCode,
        tipo: typeEnum[header.type],
        creado: header.createdAt,
        fechaMovimiento: effectiveMovementDate(header),
        observaciones: header.comments,
        cantidad: detail.quantity,
        esEntrada: header.isInput,
        nombre: detail.name,
        precio: detail.price,
        total: detail.total,
        // Cancelled movements are exported for audit, clearly flagged.
        estado: header.isCancelled ? 'Cancelada' : 'Activa',
        motivoCancelacion: header.isCancelled ? header.cancelReason ?? '' : '',
      });
    }

    const filePrefix = isInput ? 'Ingresos' : 'Salidas';
    return this.writeWorkbook(workbook, `${filePrefix}_${uuid.v4()}.xlsx`);
  }

  async importProducts(filePath: string): Promise<Product[]> {
    try {
      // Normalise the path: strip the `file://` scheme that document pickers
      // return on both iOS and Android so rnfsReadFile always receives a plain
      // filesystem path. Content URIs (content://) are left untouched — RNFS
      // handles them on Android via the ContentResolver native bridge.
      // iOS URIs are percent-encoded (spaces, accents), so decode them too.
      const resolvedPath = toFsPath(filePath);

      // Read the file as base64 and decode to the binary buffer exceljs needs.
      const base64 = await rnfsReadFile(resolvedPath, 'base64');
      const bytes = base64ToBytes(base64);

      const workbook = new ExcelJS.Workbook();
      // exceljs types annotate `load` as accepting a Node `Buffer`, but at
      // runtime it accepts any ArrayBuffer-like view (verified with a
      // Uint8Array). Cast through the parameter type to avoid a Buffer
      // polyfill in the React Native runtime.
      await workbook.xlsx.load(
        bytes as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return [];
      }

      // Build a column-index -> header-name map from the first row.
      const headerByColumn: Record<number, string> = {};
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const name = unwrapCellValue(cell.value);
        if (name !== null && name !== undefined) {
          headerByColumn[colNumber] = String(name).trim();
        }
      });

      const products: Product[] = [];

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) {
          return; // skip the header row
        }

        const record: Record<string, unknown> = {};
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const key = headerByColumn[colNumber];
          if (key) {
            record[key] = unwrapCellValue(cell.value);
          }
        });

        // Skip fully empty rows.
        if (Object.keys(record).length === 0) {
          return;
        }

        products.push(this.recordToProduct(record));
      });

      return products;
    } catch (error) {
      const err = error as Error;
      logService.logError({
        errorType: err?.name || 'ExcelImportError',
        source: 'ExcelService',
        operation: 'importProducts',
        message: err?.message || `No se pudo leer el archivo: ${filePath}`,
      });
      throw new Error('No se pudo leer el archivo');
    }
  }

  /**
   * Map a parsed spreadsheet row to a `Product`, preserving the legacy field
   * mapping (`code, sku, name, description, price, cost, stock, image`).
   */
  private recordToProduct(record: Record<string, unknown>): Product {
    const product = new Product();
    product.code = this.toStringValue(record.code);
    // Files exported before SKU support have no `sku` column → ''.
    product.sku = this.toStringValue(record.sku);
    product.name = this.toStringValue(record.name);
    product.description = this.toStringValue(record.description);
    product.price = this.toNumberValue(record.price);
    // Files exported before cost tracking have no `cost` column → 0.
    product.cost = this.toNumberValue(record.cost);
    product.stock = this.toNumberValue(record.stock);
    product.image = this.toStringValue(record.image);
    return product;
  }

  private toStringValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  private toNumberValue(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
  }

  /**
   * Serialize the workbook, resolve the destination path via {@link
   * fileService}, write it as base64, verify it exists, and return the path.
   */
  private async writeWorkbook(
    workbook: ExcelJS.Workbook,
    fileName: string,
  ): Promise<string> {
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = bytesToBase64(new Uint8Array(buffer as ArrayBuffer));

      const directory = fileService.getDownloadsPath();
      const filePath = `${directory}/${fileName}`;

      await fileService.writeFile(filePath, base64, 'base64');

      const written = await fileService.fileExists(filePath);
      if (!written) {
        throw new Error('El archivo no se encontró después de escribirlo');
      }

      return filePath;
    } catch (error) {
      const err = error as Error;
      logService.logError({
        errorType: err?.name || 'ExcelExportError',
        source: 'ExcelService',
        operation: 'writeWorkbook',
        message: err?.message || `No se pudo guardar el archivo: ${fileName}`,
      });
      throw new Error('No se pudo guardar el archivo');
    }
  }
}

/**
 * Shared singleton instance. Import this to perform Excel import/export
 * anywhere in the app so all consumers share one implementation.
 */
export const excelService: ExcelService = new ExcelServiceImpl();
