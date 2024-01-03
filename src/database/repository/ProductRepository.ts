import {Like} from 'typeorm';
import {dataSource} from '../connection/DataSource';
import {Product} from '../models/Product';
import {Response} from '../models/response/Response';

export const ProductRepository = dataSource.getRepository(Product);

export const getAllProducts = async () => {
  try {
    return await ProductRepository.find({
      take: 50,
    });
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getFullProducts = async () => {
  try {
    return await ProductRepository.find();
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getProductById = async (id: string) => {
  try {
    return await ProductRepository.findOne({where: {code: id}});
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

export const createProduct = async (product: Product) => {
  const response = new Response<Product>();

  try {
    const productCreated = await ProductRepository.save(product);

    response.success = true;
    response.message = 'Producto creado';
    response.data = productCreated;
  } catch (error) {
    response.message = `Error al crear el producto ${error.message}`;
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

    productExists.name = product.name ?? productExists.name;
    productExists.description =
      product.description ?? productExists.description;
    productExists.price = product.price ?? productExists.price;
    productExists.stock = product.stock ?? productExists.stock;

    await ProductRepository.update(product.code, productExists);

    response.success = true;
    response.message = 'Producto actualizado';
    response.data = productExists;
  } catch (error) {
    response.message = `Error al actualizar el producto ${error.message}`;
    response.data = null;
    response.success = false;
  }

  return response;
};
