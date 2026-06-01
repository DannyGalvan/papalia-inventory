import { dataSource } from '../connection/DataSource';
import { Timezone } from '../models/Timezone';
import { Response } from '../models/response/Response';

export const TimezoneRepository = dataSource.getRepository(Timezone);

export const getAllTimezones = async (): Promise<Timezone[]> => {
  try {
    return await TimezoneRepository.find({order: {region: 'ASC', displayName: 'ASC'}});
  } catch (error) {
    console.log('getAllTimezones error:', error);
    return [];
  }
};

export const getActiveTimezones = async (): Promise<Timezone[]> => {
  try {
    return await TimezoneRepository.find({where: {isActive: true}, order: {region: 'ASC', displayName: 'ASC'}});
  } catch (error) {
    console.log('getActiveTimezones error:', error);
    return [];
  }
};

export const getTimezoneByIana = async (ianaName: string): Promise<Timezone | null> => {
  try {
    return await TimezoneRepository.findOne({where: {ianaName}}) ?? null;
  } catch (error) {
    console.log('getTimezoneByIana error:', error);
    return null;
  }
};

export const toggleTimezoneActive = async (id: number): Promise<Response<Timezone>> => {
  const response = new Response<Timezone>();
  try {
    const entity = await TimezoneRepository.findOne({where: {id}});
    if (!entity) {
      response.success = false;
      response.message = 'Zona horaria no encontrada';
      return response;
    }
    entity.isActive = !entity.isActive;
    response.data = await TimezoneRepository.save(entity);
    response.success = true;
    response.message = entity.isActive ? 'Zona horaria activada' : 'Zona horaria desactivada';
    return response;
  } catch (error) {
    response.success = false;
    response.message = 'Error al cambiar el estado: ' + (error as Error).message;
    return response;
  }
};
