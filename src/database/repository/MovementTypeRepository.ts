import { dataSource } from '../connection/DataSource';
import { MovementType } from '../models/MovementType';
import { Response } from '../models/response/Response';
import { sqliteBoolean } from '../utils/sqliteBoolean';

export const MovementTypeRepository = dataSource.getRepository(MovementType);

export const getMovementTypes = async (
  isInput: boolean,
): Promise<MovementType[]> => {
  try {
    // Use explicit 1/0 — nitro-sqlite on Android maps boolean true → 'true' string,
    // which SQLite casts to 0, causing true to match nothing while false matches rows with isInput=0.
    return await MovementTypeRepository.find({
      where: { isInput: sqliteBoolean(isInput), isActive: sqliteBoolean(true) },
      order: { name: 'ASC' },
    });
  } catch (error) {
    console.log('getMovementTypes error:', error);
    return [];
  }
};

export const getAllMovementTypes = async (): Promise<MovementType[]> => {
  try {
    return await MovementTypeRepository.find({
      order: { isInput: 'ASC', name: 'ASC' },
    });
  } catch (error) {
    console.log('getAllMovementTypes error:', error);
    return [];
  }
};

export const createMovementType = async (
  name: string,
  isInput: boolean,
  isSale = false,
): Promise<Response<MovementType>> => {
  const response = new Response<MovementType>();
  try {
    const entity = MovementTypeRepository.create({
      name: name.trim(),
      isInput,
      isActive: true,
      // Only output types can be sales.
      isSale: !isInput && isSale,
    });
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

export const updateMovementType = async (
  id: number,
  name: string,
): Promise<Response<MovementType>> => {
  const response = new Response<MovementType>();
  try {
    const entity = await MovementTypeRepository.findOne({ where: { id } });
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
    response.message =
      'Error al actualizar el tipo: ' + (error as Error).message;
    return response;
  }
};

export const toggleMovementTypeActive = async (
  id: number,
): Promise<Response<MovementType>> => {
  const response = new Response<MovementType>();
  try {
    const entity = await MovementTypeRepository.findOne({ where: { id } });
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
    response.message =
      'Error al cambiar el estado: ' + (error as Error).message;
    return response;
  }
};

export const deleteMovementType = async (
  id: number,
): Promise<Response<null>> => {
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

/**
 * nitro-sqlite may return booleans as 0/1, 'true'/'false' or a null marker.
 */
export const toBool = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === 'true';

/** Flip whether an output movement type counts as a sale (revenue). */
export const toggleMovementTypeSale = async (
  id: number,
): Promise<Response<MovementType>> => {
  const response = new Response<MovementType>();
  try {
    const entity = await MovementTypeRepository.findOne({ where: { id } });
    if (!entity) {
      response.success = false;
      response.message = 'Tipo no encontrado';
      return response;
    }
    if (toBool(entity.isInput)) {
      response.success = false;
      response.message = 'Solo los tipos de salida pueden ser venta';
      return response;
    }
    entity.isSale = !toBool(entity.isSale);
    response.data = await MovementTypeRepository.save(entity);
    response.success = true;
    response.message = entity.isSale
      ? 'Tipo marcado como venta'
      : 'Tipo ya no cuenta como venta';
    return response;
  } catch (error) {
    response.success = false;
    response.message =
      'Error al cambiar el tipo de venta: ' + (error as Error).message;
    return response;
  }
};

/** Ids of output movement types flagged as sales. */
export const getSaleTypeIds = async (): Promise<number[]> => {
  const types = await getAllMovementTypes();
  return types
    .filter(t => !toBool(t.isInput) && toBool(t.isSale))
    .map(t => t.id);
};
