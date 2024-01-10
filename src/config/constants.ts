export const NAME_BD = 'quicksqlitetest-typeorm.db';
export const KEY_DIR_IMAGES = 'dir_images';

export const OUTPUT_TYPES = {
  no_seleccionado: 0,
  Venta: 1,
  extraordinaria: 2,
  regalo_jefes: 3,
  regalo_trabajadores: 4,
  regalo_clientes: 5,
  regalo_proveedores: 6,
};

export const OUTPUT_ENUM = {
  0: 'no seleccionado',
  1: 'Venta',
  2: 'extraordinaria',
  3: 'regalo jefes',
  4: 'regalo trabajadores',
  5: 'regalo clientes',
  6: 'regalo proveedores',
};

export const OUPUT_DATA = [
  {id: OUTPUT_TYPES.no_seleccionado, value: 'Seleccione una opción'},
  {id: OUTPUT_TYPES.Venta, value: 'Venta'},
  {id: OUTPUT_TYPES.extraordinaria, value: 'Extraordinaria'},
  {id: OUTPUT_TYPES.regalo_jefes, value: 'Regalo para jefes'},
  {id: OUTPUT_TYPES.regalo_trabajadores, value: 'Regalo para trabajadores'},
  {id: OUTPUT_TYPES.regalo_clientes, value: 'Regalo para clientes'},
  {id: OUTPUT_TYPES.regalo_proveedores, value: 'Regalo para proveedores'},
];

export const INPUT_TYPES = {
  no_seleccionado: 0,
  compra_inventario: 7,
  devolucion: 8,
  compra_extraordinaria: 9,
  otros_conceptos: 10,
};

export const INPUT_DATA = [
  {id: INPUT_TYPES.no_seleccionado, value: 'Seleccione una opción'},
  {id: INPUT_TYPES.compra_inventario, value: 'Compra de inventario'},
  {id: INPUT_TYPES.devolucion, value: 'Devolución'},
  {id: INPUT_TYPES.compra_extraordinaria, value: 'Compra extraordinaria'},
  {id: INPUT_TYPES.otros_conceptos, value: 'Otros conceptos'},
];

export const INPUT_ENUM = {
  0: 'no seleccionado',
  7: 'compra inventario',
  8: 'devolución',
  9: 'compra extraordinaria',
  10: 'otros conceptos',
};

export const ALL_IN_OUT_ENUM = {
  ...OUTPUT_ENUM,
  ...INPUT_ENUM,
};

export const ALL_IN_OUT_TYPES = {
  ...OUTPUT_TYPES,
  ...INPUT_TYPES,
};
