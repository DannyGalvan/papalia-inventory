import { dataSource } from '../connection/DataSource';
import { Category } from '../models/Category';
import { Response } from '../models/response/Response';

export const CategoryRepository = dataSource.getRepository(Category);

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    return await CategoryRepository.find({order: {name: 'ASC'}});
  } catch (error) {
    console.log('getAllCategories error:', error);
    return [];
  }
};

export const getActiveCategories = async (): Promise<Category[]> => {
  try {
    return await CategoryRepository.find({where: {isActive: true}, order: {name: 'ASC'}});
  } catch (error) {
    console.log('getActiveCategories error:', error);
    return [];
  }
};

export const createCategory = async (name: string, description: string, color: string): Promise<Response<Category>> => {
  const response = new Response<Category>();
  try {
    const entity = CategoryRepository.create({name: name.trim(), description: description.trim(), color, isActive: true});
    response.data = await CategoryRepository.save(entity);
    response.success = true;
    response.message = 'Categoría creada correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al crear la categoría: ' + (error as Error).message;
    return response;
  }
};

export const updateCategory = async (id: number, name: string, description: string, color: string): Promise<Response<Category>> => {
  const response = new Response<Category>();
  try {
    const entity = await CategoryRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Categoría no encontrada';
      return response;
    }
    entity.name = name.trim();
    entity.description = description.trim();
    entity.color = color;
    response.data = await CategoryRepository.save(entity);
    response.success = true;
    response.message = 'Categoría actualizada correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al actualizar la categoría: ' + (error as Error).message;
    return response;
  }
};

export const toggleCategoryActive = async (id: number): Promise<Response<Category>> => {
  const response = new Response<Category>();
  try {
    const entity = await CategoryRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Categoría no encontrada';
      return response;
    }
    entity.isActive = !entity.isActive;
    response.data = await CategoryRepository.save(entity);
    response.success = true;
    response.message = entity.isActive ? 'Categoría activada' : 'Categoría desactivada';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al cambiar el estado: ' + (error as Error).message;
    return response;
  }
};

export const deleteCategory = async (id: number): Promise<Response<null>> => {
  const response = new Response<null>();
  try {
    await CategoryRepository.delete(id);
    response.success = true;
    response.message = 'Categoría eliminada correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al eliminar la categoría: ' + (error as Error).message;
    return response;
  }
};
