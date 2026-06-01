import { Between } from 'typeorm';
import {
    ALL_IN_OUT_ENUM,
    ALL_IN_OUT_TYPES,
    INPUT_ENUM,
} from '../../config/constants';
import { dataSource } from '../connection/DataSource';
import { LogHeader } from '../models/LogHeader';
import { DashboardResponse } from '../models/response/DashboardResponse';
import { LogDetailResponse } from '../models/response/LogDetailResponse';
import { Response } from '../models/response/Response';
import { LogDetailRepository } from './LogDetailRepository';
import { getAllMovementTypes } from './MovementTypeRepository';
import { getProductById, updateProduct } from './ProductRepository';

const buildTypeNameMap = async (): Promise<Record<number, string>> => {
  const map: Record<number, string> = {...ALL_IN_OUT_ENUM} as Record<number, string>;
  try {
    const dbTypes = await getAllMovementTypes();
    dbTypes.forEach(t => { map[t.id] = t.name; });
  } catch {}
  return map;
};

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
    order: { id: 'DESC' },
  });
};

export const getDashboardInputs = async (initialDate?: Date, finalDate?: Date) => {
  const [logs, typeNameMap] = await Promise.all([
    LogHeaderRepository.find({
      where: {
        isInput: true,
        ...(initialDate && finalDate ? {createdAt: Between(initialDate, finalDate)} : {}),
      },
      order: { id: 'DESC' },
      relations: ['logDetails', 'logDetails.product'],
    }),
    buildTypeNameMap(),
  ]);

  const inputDetails: DashboardResponse[] = [];

  const grouped: { [tipo: string]: LogHeader[] } = logs.reduce(
    (acc, item) => {
      const typeName = typeNameMap[item.type] ?? `Tipo ${item.type}`;
      if (!acc[typeName]) { acc[typeName] = []; }
      acc[typeName].push(item);
      return acc;
    },
    {},
  );

  for (const key in grouped) {
    const element = grouped[key];
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
    order: { id: 'DESC' },
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
        observaciones: log.comments,
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

export const getDashboardOutputs = async (initialDate?: Date, finalDate?: Date) => {
  const [logs, typeNameMap] = await Promise.all([
    LogHeaderRepository.find({
      where: {
        isInput: false,
        ...(initialDate && finalDate ? {createdAt: Between(initialDate, finalDate)} : {}),
      },
      order: { id: 'DESC' },
      relations: ['logDetails', 'logDetails.product'],
    }),
    buildTypeNameMap(),
  ]);

  const outputDetails: DashboardResponse[] = [];

  const grouped: { [tipo: string]: LogHeader[] } = logs.reduce(
    (acc, item) => {
      const typeName = typeNameMap[item.type] ?? `Tipo ${item.type}`;
      if (!acc[typeName]) { acc[typeName] = []; }
      acc[typeName].push(item);
      return acc;
    },
    {},
  );

  for (const key in grouped) {
    const element = grouped[key];
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
    order: { id: 'DESC' },
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
        observaciones: log.comments,
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
    const log = await LogHeaderRepository.findOne({
      where: {
        id,
      },
      relations: ['logDetails', 'logDetails.product'],
    });
    console.log('log found', log);
    return log;
  } catch (error) {
    console.log(error);
    const log = new LogHeader();
    log.id = 0;
    log.logDetails = [];
    log.createdAt = new Date();
    log.comments = 'No se encontraron datos';
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

    const details = log.logDetails.map(detail => {
      {
        detail.logHeaderId = logCreated.id;
        return detail;
      }
    });

    await LogDetailRepository.save(details);

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
