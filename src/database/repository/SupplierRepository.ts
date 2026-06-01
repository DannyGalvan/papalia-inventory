import { Like } from 'typeorm';
import { dataSource } from '../connection/DataSource';
import { Supplier } from '../models/Supplier';
import { Response } from '../models/response/Response';

export const SupplierRepository = dataSource.getRepository(Supplier);

export const getAllSuppliers = async (): Promise<Supplier[]> => {
  try {
    return await SupplierRepository.find({order: {name: 'ASC'}});
  } catch (error) {
    console.log('getAllSuppliers error:', error);
    return [];
  }
};

export const getActiveSuppliers = async (): Promise<Supplier[]> => {
  try {
    return await SupplierRepository.find({where: {isActive: true}, order: {name: 'ASC'}});
  } catch (error) {
    console.log('getActiveSuppliers error:', error);
    return [];
  }
};

export const searchSuppliers = async (query: string): Promise<Supplier[]> => {
  try {
    return await SupplierRepository.find({
      where: [{name: Like(`%${query}%`)}, {phone: Like(`%${query}%`)}],
      order: {name: 'ASC'},
    });
  } catch (error) {
    console.log('searchSuppliers error:', error);
    return [];
  }
};

export const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Response<Supplier>> => {
  const response = new Response<Supplier>();
  try {
    const entity = SupplierRepository.create({...supplier, isActive: true});
    response.data = await SupplierRepository.save(entity);
    response.success = true;
    response.message = 'Proveedor creado correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al crear el proveedor: ' + (error as Error).message;
    return response;
  }
};

export const updateSupplier = async (id: number, supplier: Partial<Omit<Supplier, 'id'>>): Promise<Response<Supplier>> => {
  const response = new Response<Supplier>();
  try {
    const entity = await SupplierRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Proveedor no encontrado';
      return response;
    }
    Object.assign(entity, supplier);
    response.data = await SupplierRepository.save(entity);
    response.success = true;
    response.message = 'Proveedor actualizado correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al actualizar el proveedor: ' + (error as Error).message;
    return response;
  }
};

export const toggleSupplierActive = async (id: number): Promise<Response<Supplier>> => {
  const response = new Response<Supplier>();
  try {
    const entity = await SupplierRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Proveedor no encontrado';
      return response;
    }
    entity.isActive = !entity.isActive;
    response.data = await SupplierRepository.save(entity);
    response.success = true;
    response.message = entity.isActive ? 'Proveedor activado' : 'Proveedor desactivado';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al cambiar el estado: ' + (error as Error).message;
    return response;
  }
};

export const deleteSupplier = async (id: number): Promise<Response<null>> => {
  const response = new Response<null>();
  try {
    await SupplierRepository.delete(id);
    response.success = true;
    response.message = 'Proveedor eliminado correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al eliminar el proveedor: ' + (error as Error).message;
    return response;
  }
};
