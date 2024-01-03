import {Between} from 'typeorm';
import {
  ALL_IN_OUT_ENUM,
  ALL_IN_OUT_TYPES,
  INPUT_ENUM,
} from '../../config/constants';
import {dataSource} from '../connection/DataSource';
import {LogHeader} from '../models/LogHeader';
import {Response} from '../models/response/Response';
import {getProductById, updateProduct} from './ProductRepository';
import {LogDetailResponse} from '../models/response/LogDetailResponse';
import {DashboardResponse} from '../models/response/DashboardResponse';

export const LogHeaderRepository = dataSource.getRepository(LogHeader);

export const getAllLogsByDate = async (
  initialDate: Date,
  finalDate: Date,
  isInput: boolean,
) => {
  return await LogHeaderRepository.find({
    where: {
      createdAt: Between(initialDate, finalDate),
      isInput: isInput,
    },
    order: {id: 'DESC'},
  });
};

export const getDashboardInputs = async () => {
  const logs = await LogHeaderRepository.find({
    where: {
      isInput: true,
    },
    order: {id: 'DESC'},
    relations: ['logDetails', 'logDetails.product'],
  });

  const inputDetails: DashboardResponse[] = [];

  const DetailResponse: {[tipo: string]: LogHeader[]} = logs.reduce(
    (acc, item) => {
      // Usa el tipo como clave para agrupar
      if (!acc[ALL_IN_OUT_ENUM[item.type]]) {
        acc[ALL_IN_OUT_ENUM[item.type]] = [];
      }

      // Agrega el elemento al grupo correspondiente
      acc[ALL_IN_OUT_ENUM[item.type]].push(item);

      return acc;
    },
    {},
  );

  for (const key in DetailResponse) {
    const element = DetailResponse[key];
    const total = element.map(e => e.logDetails).flat();

    inputDetails.push({
      tipo: key,
      cantidad: total.reduce((acc, item) => acc + item.quantity, 0),
      total: total.reduce((acc, item) => acc + item.total, 0),
    });
  }

  return inputDetails;
};

export const getAllInputLogs = async () => {
  const logs = await LogHeaderRepository.find({
    where: {
      isInput: true,
    },
    order: {id: 'DESC'},
    relations: ['logDetails'],
  });

  const DetailResponses: LogDetailResponse[] = [];

  logs.forEach(log => {
    const DetailResponse: LogDetailResponse[] = log.logDetails.map(d => {
      return {
        id: d.id,
        Codigo: d.productCode,
        tipo: INPUT_ENUM[log.type],
        creado: log.createdAt,
        observaciones: log.commets,
        cantidad: d.quantity,
        esEntrada: log.isInput,
        nombre: d.name,
        precio: d.price,
        total: d.total,
      };
    });

    DetailResponses.push(...DetailResponse);
  });

  return DetailResponses;
};

export const getDashboardOutputs = async () => {
  const logs = await LogHeaderRepository.find({
    where: {
      isInput: false,
    },
    order: {id: 'DESC'},
    relations: ['logDetails', 'logDetails.product'],
  });

  const outputDetails: DashboardResponse[] = [];

  const DetailResponse: {[tipo: string]: LogHeader[]} = logs.reduce(
    (acc, item) => {
      // Usa el tipo como clave para agrupar
      if (!acc[ALL_IN_OUT_ENUM[item.type]]) {
        acc[ALL_IN_OUT_ENUM[item.type]] = [];
      }

      // Agrega el elemento al grupo correspondiente
      acc[ALL_IN_OUT_ENUM[item.type]].push(item);

      return acc;
    },
    {},
  );

  for (const key in DetailResponse) {
    const element = DetailResponse[key];
    const total = element.map(e => e.logDetails).flat();

    outputDetails.push({
      tipo: key,
      cantidad: total.reduce((acc, item) => acc + item.quantity, 0),
      total: total.reduce((acc, item) => acc + item.total, 0),
    });
  }

  return outputDetails;
};

export const getAllOutputLogs = async () => {
  const logs = await LogHeaderRepository.find({
    where: {
      isInput: false,
    },
    order: {id: 'DESC'},
    relations: ['logDetails'],
  });

  const DetailResponses: LogDetailResponse[] = [];

  logs.forEach(log => {
    const DetailResponse: LogDetailResponse[] = log.logDetails.map(d => {
      return {
        id: d.id,
        Codigo: d.productCode,
        tipo: ALL_IN_OUT_ENUM[log.type],
        creado: log.createdAt,
        observaciones: log.commets,
        cantidad: d.quantity,
        esEntrada: log.isInput,
        nombre: d.name,
        precio: d.price,
        total: d.total,
      };
    });

    DetailResponses.push(...DetailResponse);
  });

  return DetailResponses;
};

export const getLogById = async (id: number) => {
  try {
    return await LogHeaderRepository.findOne({
      where: {
        id,
      },
      relations: ['logDetails', 'logDetails.product'],
    });
  } catch (error) {
    console.log(error);
    const log = new LogHeader();
    log.id = 0;
    log.logDetails = [];
    log.createdAt = new Date();
    log.commets = 'No se encontraron datos';
    log.type = ALL_IN_OUT_TYPES.no_seleccionado;
    log.isInput = false;
    return log;
  }
};

export const createLog = async (log: LogHeader) => {
  const response = new Response<LogHeader>();
  try {
    const logHeader = LogHeaderRepository.create(log);

    const logCreated = await LogHeaderRepository.save(logHeader);

    if (logCreated.isInput) {
      const products = logCreated.logDetails.map(d => d);

      for (const product of products) {
        const productToUpdate = await getProductById(product.productCode);

        if (productToUpdate) {
          productToUpdate.stock += product.quantity;
          const productUpdated = await updateProduct(productToUpdate);

          if (!productUpdated.success) {
            response.success = false;
            response.message = `Error al actualizar el producto ${product.productCode}`;
            response.data = null;
            return response;
          }
        }
      }
    } else {
      const products = logCreated.logDetails.map(d => d);

      for (const product of products) {
        const productToUpdate = await getProductById(product.productCode);

        if (productToUpdate) {
          productToUpdate.stock -= product.quantity;
          const productUpdated = await updateProduct(productToUpdate);

          if (!productUpdated.success) {
            response.success = false;
            response.message = `Error al actualizar el stock del producto ${product.productCode}`;
            response.data = null;
            return response;
          }
        }
      }
    }

    response.success = true;
    response.data = logCreated;
    return response;
  } catch (error) {
    response.success = false;
    response.message = `Error al crear el registro ${error.message}`;
    response.data = null;
    return response;
  }
};
