import { dataSource } from '../connection/DataSource';
import { UnitOfMeasure } from '../models/UnitOfMeasure';
import { Response } from '../models/response/Response';

export const UnitOfMeasureRepository = dataSource.getRepository(UnitOfMeasure);

export const getAllUnits = async (): Promise<UnitOfMeasure[]> => {
  try {
    return await UnitOfMeasureRepository.find({order: {name: 'ASC'}});
  } catch (error) {
    console.log('getAllUnits error:', error);
    return [];
  }
};

export const getActiveUnits = async (): Promise<UnitOfMeasure[]> => {
  try {
    return await UnitOfMeasureRepository.find({where: {isActive: true}, order: {name: 'ASC'}});
  } catch (error) {
    console.log('getActiveUnits error:', error);
    return [];
  }
};

export const createUnit = async (name: string, abbreviation: string): Promise<Response<UnitOfMeasure>> => {
  const response = new Response<UnitOfMeasure>();
  try {
    const entity = UnitOfMeasureRepository.create({name: name.trim(), abbreviation: abbreviation.trim(), isActive: true});
    response.data = await UnitOfMeasureRepository.save(entity);
    response.success = true;
    response.message = 'Unidad creada correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al crear la unidad: ' + (error as Error).message;
    return response;
  }
};

export const updateUnit = async (id: number, name: string, abbreviation: string): Promise<Response<UnitOfMeasure>> => {
  const response = new Response<UnitOfMeasure>();
  try {
    const entity = await UnitOfMeasureRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Unidad no encontrada';
      return response;
    }
    entity.name = name.trim();
    entity.abbreviation = abbreviation.trim();
    response.data = await UnitOfMeasureRepository.save(entity);
    response.success = true;
    response.message = 'Unidad actualizada correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al actualizar la unidad: ' + (error as Error).message;
    return response;
  }
};

export const toggleUnitActive = async (id: number): Promise<Response<UnitOfMeasure>> => {
  const response = new Response<UnitOfMeasure>();
  try {
    const entity = await UnitOfMeasureRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Unidad no encontrada';
      return response;
    }
    entity.isActive = !entity.isActive;
    response.data = await UnitOfMeasureRepository.save(entity);
    response.success = true;
    response.message = entity.isActive ? 'Unidad activada' : 'Unidad desactivada';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al cambiar el estado: ' + (error as Error).message;
    return response;
  }
};

export const deleteUnit = async (id: number): Promise<Response<null>> => {
  const response = new Response<null>();
  try {
    await UnitOfMeasureRepository.delete(id);
    response.success = true;
    response.message = 'Unidad eliminada correctamente';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al eliminar la unidad: ' + (error as Error).message;
    return response;
  }
};
