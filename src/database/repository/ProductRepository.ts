import { Like } from 'typeorm';
import { dataSource } from '../connection/DataSource';
import { Product } from '../models/Product';
import { Response } from '../models/response/Response';
import { isNitroNull, toBool } from '../utils/nitroValues';
import { ProductStatusFilter, buildProductStatusWhere } from './productStatus';

export const ProductRepository = dataSource.getRepository(Product);

type SqlParam = string | number | null;

const PRODUCT_RELATIONS = ['category', 'unitOfMeasure', 'supplier'];

// react-native-nitro-sqlite returns {isNitroSQLiteNull: true} instead of null/undefined
// for NULL columns — and on Android can also return it for falsy integer/boolean values (0).
// TypeORM hydrates partial relation objects with all fields as this marker.
// We must normalize all fields before rendering.
function normalizeProduct(p: Product): Product {
  // Direct columns: coerce nitro-null or wrong types to safe defaults
  if (isNitroNull(p.stock) || typeof p.stock !== 'number') {
    p.stock = 0;
  }
  if (isNitroNull(p.price) || typeof p.price !== 'number') {
    p.price = 0;
  }
  if (isNitroNull(p.cost) || typeof p.cost !== 'number') {
    p.cost = Number(p.cost) || 0;
  }
  if (isNitroNull(p.name) || typeof p.name !== 'string') {
    p.name = '';
  }
  if (isNitroNull(p.description) || typeof p.description !== 'string') {
    p.description = '';
  }
  if (isNitroNull(p.image) || typeof p.image !== 'string') {
    p.image = '';
  }
  if (isNitroNull(p.sku) || typeof p.sku !== 'string') {
    p.sku = '';
  }
  // NOT NULL DEFAULT 1: a missing value means the default (active).
  p.isActive =
    p.isActive == null || isNitroNull(p.isActive) ? true : toBool(p.isActive);
  // Relations: partial hydrated objects with nitro-null fields → set to null
  if (isNitroNull(p.category)) {
    p.category = null;
  }
  if (isNitroNull(p.supplier)) {
    p.supplier = null;
  }
  if (isNitroNull(p.unitOfMeasure)) {
    p.unitOfMeasure = null;
  }
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
    const products = await ProductRepository.find({
      relations: PRODUCT_RELATIONS,
    });
    return products.map(normalizeProduct);
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getProductsPaged = async (
  skip: number,
  take: number,
  status: ProductStatusFilter = 'all',
) => {
  const products = await ProductRepository.find({
    where: buildProductStatusWhere(status),
    skip: Math.max(0, skip),
    take: Math.max(0, take),
    relations: PRODUCT_RELATIONS,
  });
  return products.map(normalizeProduct);
};

export const getProductById = async (id: string) => {
  try {
    const product = await ProductRepository.findOne({ where: { code: id } });
    return product ? normalizeProduct(product) : null;
  } catch (error) {
    console.log(error);
    const product = new Product();
    product.code = '0000';
    product.name = 'Sin Datos';
    product.price = 0;
    product.cost = 0;
    product.description = 'No se encontraron datos';
    product.stock = 0;
    return product;
  }
};

export const getTotalProducts = async (status: ProductStatusFilter = 'all') => {
  try {
    return await ProductRepository.count({
      where: buildProductStatusWhere(status),
    });
  } catch (error) {
    console.log(error);
    return 0;
  }
};

/** Matches the code, name or supplier SKU (case-insensitive LIKE). */
export const searchProductsByCodeOrName = async (
  search: string,
  status: ProductStatusFilter = 'all',
) => {
  try {
    const statusWhere = buildProductStatusWhere(status);
    const products = await ProductRepository.find({
      where: [
        { code: Like(`%${search}%`), ...statusWhere },
        { name: Like(`%${search}%`), ...statusWhere },
        { sku: Like(`%${search}%`), ...statusWhere },
      ],
    });
    return products.map(normalizeProduct);
  } catch (error) {
    console.log(error);
    return [];
  }
};

/** Product search for inputs/outputs: inactive products are never offered. */
export const searchActiveProductsByCodeOrName = (search: string) =>
  searchProductsByCodeOrName(search, 'active');

/** Enable or disable a product without touching any other column. */
export const setProductActive = async (
  code: string,
  isActive: boolean,
): Promise<Response<null>> => {
  const response = new Response<null>();
  try {
    // Integer literal binding: nitro-sqlite on Android binds JS booleans as
    // the string 'true', which SQLite would store as text.
    await dataSource.query(
      'UPDATE "product" SET "isActive" = ? WHERE "code" = ?',
      [isActive ? 1 : 0, code],
    );
    response.success = true;
    response.message = isActive ? 'Producto activado' : 'Producto desactivado';
  } catch (error) {
    response.message = `Error al cambiar el estado del producto ${
      (error as Error).message
    }`;
  }
  return response;
};

// Helper: build SET clause for a nullable FK column without sending null as a parameter.
// nitro-sqlite on Android cannot bind null as a query parameter — instead we embed
// the SQL literal NULL directly in the query string when the value is null.
function appendNullableFk(
  col: string,
  value: number | null | undefined,
  sets: string[],
  params: SqlParam[],
): void {
  if (value === undefined) {
    return;
  }
  if (value === null) {
    sets.push(`"${col}" = NULL`);
  } else {
    sets.push(`"${col}" = ?`);
    params.push(value);
  }
}

export const updateProduct = async (product: Product) => {
  const response = new Response<Product>();
  try {
    const productExists = await ProductRepository.findOne({
      where: { code: product.code },
    });

    if (!productExists) {
      response.message = 'El producto no existe';
      response.data = null;
      response.success = false;
      return response;
    }

    // Update base (non-null) columns via TypeORM
    const base: Partial<Product> = {};
    if (product.name != null) {
      base.name = product.name;
    }
    if (product.description != null) {
      base.description = product.description;
    }
    if (product.price != null) {
      base.price = product.price;
    }
    if (product.cost != null) {
      base.cost = Number(product.cost) || 0;
    }
    if (product.stock != null) {
      base.stock = product.stock;
    }
    if (product.image != null) {
      base.image = product.image;
    }
    if (product.sku != null) {
      base.sku = product.sku;
    }
    if (Object.keys(base).length > 0) {
      await ProductRepository.update(product.code, base);
    }

    // Update nullable FK columns using SQL literal NULL when null to avoid
    // the nitro-sqlite null-parameter crash on Android. `isActive` is bound as
    // an integer here for the same driver reason.
    const fkSets: string[] = [];
    const fkParams: SqlParam[] = [];
    appendNullableFk('categoryId', product.categoryId, fkSets, fkParams);
    appendNullableFk('supplierId', product.supplierId, fkSets, fkParams);
    appendNullableFk('unitId', product.unitId, fkSets, fkParams);
    if (typeof product.isActive === 'boolean') {
      fkSets.push('"isActive" = ?');
      fkParams.push(product.isActive ? 1 : 0);
    }
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
    response.message = `Error al actualizar el producto ${
      (error as Error).message
    }`;
    response.data = null;
    response.success = false;
  }
  return response;
};
