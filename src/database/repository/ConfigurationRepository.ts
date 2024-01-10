import {dataSource} from '../connection/DataSource';
import {Configuration} from '../models/Configuration';
import {Response} from '../models/response/Response';

export const ConfigurationRepository = dataSource.getRepository(Configuration);

export const getAllConfigurations = async () => {
  try {
    return await ConfigurationRepository.find();
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getConfigurationByKey = async (key: string) => {
  try {
    return await ConfigurationRepository.findOne({where: {key}});
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const createConfiguration = async (data: Configuration) => {
  const response = new Response<Configuration>();
  try {
    const createEntity = await ConfigurationRepository.save(data);

    response.data = createEntity;
    response.success = true;
    response.message = 'Configuración creada correctamente';

    return response;
  } catch (error) {
    response.data = null;
    response.success = false;
    response.message = 'Error al crear la configuración ' + error.message;

    return response;
  }
};

export const updateConfiguration = async (data: Configuration) => {
  const response = new Response<Configuration>();
  try {
    const entity = await ConfigurationRepository.findOne({
      where: {key: data.key},
    });

    if (!entity) {
      response.data = null;
      response.success = false;
      response.message = 'La configuración no existe';

      return response;
    }

    entity.value = data.value ?? entity.value;

    const updateEntity = await ConfigurationRepository.save(entity);

    response.data = updateEntity;
    response.success = true;
    response.message = 'Configuración actualizada correctamente';

    return response;
  } catch (error) {
    response.data = null;
    response.success = false;
    response.message = 'Error al actualizar la configuración ' + error.message;

    return response;
  }
};
