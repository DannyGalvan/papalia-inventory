export class LogDetailResponse {
  id: number;
  Codigo: string;
  tipo: string;
  creado: Date;
  /** Business date (sale/receipt) of the movement. */
  fechaMovimiento: Date;
  observaciones: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
  esEntrada: boolean;
}
