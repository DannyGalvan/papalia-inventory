import { dataSource } from '../connection/DataSource';
import { MovementType } from '../models/MovementType';
import { Response } from '../models/response/Response';

export const MovementTypeRepository = dataSource.getRepository(MovementType);

export const getMovementTypes = async (isInput: boolean): Promise<MovementType[]> => {
  try {
    return await MovementTypeRepository.find({
      where: {isInput, isActive: true},
      order: {name: 'ASC'},
    });
  } catch (error) {
    console.log('getMovementTypes error:', error);
    return [];
  }
};

export const getAllMovementTypes = async (): Promise<MovementType[]> => {
  try {
    return await MovementTypeRepository.find({order: {isInput: 'ASC', name: 'ASC'}});
  } catch (error) {
    console.log('getAllMovementTypes error:', error);
    return [];
  }
};

export const createMovementType = async (name: string, isInput: boolean): Promise<Response<MovementType>> => {
  const response = new Response<MovementType>();
  try {
    const entity = MovementTypeRepository.create({name: name.trim(), isInput, isActive: true});
    response.data = await MovementTypeRepository.save(entity);
    response.success = true;
    response.message = 'Tipo creado correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al crear el tipo: ' + (error as Error).message;
    return response;
  }
};

export const updateMovementType = async (id: number, name: string): Promise<Response<MovementType>> => {
  const response = new Response<MovementType>();
  try {
    const entity = await MovementTypeRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Tipo no encontrado';
      return response;
    }
    entity.name = name.trim();
    response.data = await MovementTypeRepository.save(entity);
    response.success = true;
    response.message = 'Tipo actualizado correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al actualizar el tipo: ' + (error as Error).message;
    return response;
  }
};

export const toggleMovementTypeActive = async (id: number): Promise<Response<MovementType>> => {
  const response = new Response<MovementType>();
  try {
    const entity = await MovementTypeRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Tipo no encontrado';
      return response;
    }
    entity.isActive = !entity.isActive;
    response.data = await MovementTypeRepository.save(entity);
    response.success = true;
    response.message = entity.isActive ? 'Tipo activado' : 'Tipo desactivado';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al cambiar el estado: ' + (error as Error).message;
    return response;
  }
};

export const deleteMovementType = async (id: number): Promise<Response<null>> => {
  const response = new Response<null>();
  try {
    await MovementTypeRepository.delete(id);
    response.success = true;
    response.message = 'Tipo eliminado correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al eliminar el tipo: ' + (error as Error).message;
    return response;
  }
};
