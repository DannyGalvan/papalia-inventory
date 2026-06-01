import { Like } from 'typeorm';
import { dataSource } from '../connection/DataSource';
import { Product } from '../models/Product';
import { Response } from '../models/response/Response';

export const ProductRepository = dataSource.getRepository(Product);

const PRODUCT_RELATIONS = ['category', 'unitOfMeasure', 'supplier'];

// react-native-nitro-sqlite returns {isNitroSQLiteNull: true} instead of null/undefined
// for NULL columns — and on Android can also return it for falsy integer/boolean values (0).
// TypeORM hydrates partial relation objects with all fields as this marker.
// We must normalize all fields before rendering.
function isNitroNull(v: unknown): boolean {
  return (
    v !== null &&
    typeof v === 'object' &&
    Object.prototype.hasOwnProperty.call(v, 'isNitroSQLiteNull')
  );
}

function normalizeProduct(p: Product): Product {
  // Direct columns: coerce nitro-null or wrong types to safe defaults
  if (isNitroNull(p.stock) || typeof p.stock !== 'number') { (p as any).stock = 0; }
  if (isNitroNull(p.price) || typeof p.price !== 'number') { (p as any).price = 0; }
  if (isNitroNull(p.name) || typeof p.name !== 'string') { (p as any).name = ''; }
  if (isNitroNull(p.description) || typeof p.description !== 'string') { (p as any).description = ''; }
  if (isNitroNull(p.image) || typeof p.image !== 'string') { (p as any).image = ''; }
  // Relations: partial hydrated objects with nitro-null fields → set to null
  if (isNitroNull(p.category)) { (p as any).category = null; }
  if (isNitroNull(p.supplier)) { (p as any).supplier = null; }
  if (isNitroNull(p.unitOfMeasure)) { (p as any).unitOfMeasure = null; }
  return p;
}

export const getAllProducts = async () => {
  try {
    const products = await ProductRepository.find({
      take: 50,
      relations: PRODUCT_RELATIONS,
    });
    return products.map(normalizeProduct);
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getFullProducts = async () => {
  try {
    const products = await ProductRepository.find({relations: PRODUCT_RELATIONS});
    return products.map(normalizeProduct);
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getProductsPaged = async (skip: number, take: number) => {
  const products = await ProductRepository.find({
    skip: Math.max(0, skip),
    take: Math.max(0, take),
    relations: PRODUCT_RELATIONS,
  });
  return products.map(normalizeProduct);
};

export const getProductById = async (id: string) => {
  try {
    const product = await ProductRepository.findOne({where: {code: id}});
    return product ? normalizeProduct(product) : null;
  } catch (error) {
    console.log(error);
    const product = new Product();
    product.code = '0000';
    product.name = 'Sin Datos';
    product.price = 0;
    product.description = 'No se encontraron datos';
    product.stock = 0;
    return product;
  }
};

export const getTotalProducts = async () => {
  try {
    return await ProductRepository.count();
  } catch (error) {
    console.log(error);
    return 0;
  }
};

export const searchProductsByCodeOrName = async (search: string) => {
  try {
    return await ProductRepository.find({
      where: [{code: Like(`%${search}%`)}, {name: Like(`%${search}%`)}],
    });
  } catch (error) {
    console.log(error);
    return [];
  }
};

// Helper: build SET clause for a nullable FK column without sending null as a parameter.
// nitro-sqlite on Android cannot bind null as a query parameter — instead we embed
// the SQL literal NULL directly in the query string when the value is null.
function appendNullableFk(
  col: string,
  value: number | null | undefined,
  sets: string[],
  params: any[],
): void {
  if (value === undefined) { return; }
  if (value === null) {
    sets.push(`"${col}" = NULL`);
  } else {
    sets.push(`"${col}" = ?`);
    params.push(value);
  }
}

export const createProduct = async (product: Product) => {
  const response = new Response<Product>();
  try {
    // Build a dynamic INSERT that excludes null FK columns entirely.
    // Omitting them lets SQLite apply the column default (NULL), avoiding the
    // null-parameter crash in nitro-sqlite on Android.
    const cols: string[] = ['"code"', '"name"', '"description"', '"price"', '"stock"', '"image"'];
    const vals: any[] = [
      product.code,
      product.name,
      product.description,
      product.price,
      product.stock,
      product.image ?? '',
    ];
    if (product.categoryId != null) { cols.push('"categoryId"'); vals.push(product.categoryId); }
    if (product.supplierId != null) { cols.push('"supplierId"'); vals.push(product.supplierId); }
    if (product.unitId != null) { cols.push('"unitId"'); vals.push(product.unitId); }

    await dataSource.query(
      `INSERT INTO "product" (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
      vals,
    );

    response.success = true;
    response.message = 'Producto creado';
    response.data = product;
  } catch (error) {
    response.message = `Error al crear el producto ${(error as Error).message}`;
    response.data = null;
    response.success = false;
  }
  return response;
};

export const updateProduct = async (product: Product) => {
  const response = new Response<Product>();
  try {
    const productExists = await ProductRepository.findOne({
      where: {code: product.code},
    });

    if (!productExists) {
      response.message = 'El producto no existe';
      response.data = null;
      response.success = false;
      return response;
    }

    // Update base (non-null) columns via TypeORM
    const base: Partial<Product> = {};
    if (product.name != null) { base.name = product.name; }
    if (product.description != null) { base.description = product.description; }
    if (product.price != null) { base.price = product.price; }
    if (product.stock != null) { base.stock = product.stock; }
    if (product.image != null) { base.image = product.image; }
    if (Object.keys(base).length > 0) {
      await ProductRepository.update(product.code, base);
    }

    // Update nullable FK columns using SQL literal NULL when null to avoid
    // the nitro-sqlite null-parameter crash on Android.
    const fkSets: string[] = [];
    const fkParams: any[] = [];
    appendNullableFk('categoryId', product.categoryId, fkSets, fkParams);
    appendNullableFk('supplierId', product.supplierId, fkSets, fkParams);
    appendNullableFk('unitId', product.unitId, fkSets, fkParams);
    if (fkSets.length > 0) {
      fkParams.push(product.code);
      await dataSource.query(
        `UPDATE "product" SET ${fkSets.join(', ')} WHERE "code" = ?`,
        fkParams,
      );
    }

    response.success = true;
    response.message = 'Producto actualizado';
    response.data = product;
  } catch (error) {
    response.message = `Error al actualizar el producto ${(error as Error).message}`;
    response.data = null;
    response.success = false;
  }
  return response;
};
