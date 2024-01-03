import {IResponse} from '../../../interfaces/IResponse';

export class Response<T> implements IResponse<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor() {
    this.success = false;
    this.message = '';
    this.data = null;
  }
}
