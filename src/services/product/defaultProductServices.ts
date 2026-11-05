import { typeormSqlExecutor } from '../../database/connection/typeormSqlExecutor';
import { updateProduct } from '../../database/repository/ProductRepository';
import { SqlProductStore } from '../../database/repository/SqlProductStore';
import { ProductCreationService } from './ProductCreationService';
import { ProductUpdateService } from './ProductUpdateService';
import { SequentialProductCodeGenerator } from './SequentialProductCodeGenerator';

const store = new SqlProductStore(typeormSqlExecutor);

/** App-wide instances wired to the SQLite database (composition root). */
export const productCreationService = new ProductCreationService(
  store,
  new SequentialProductCodeGenerator(),
);

export const productUpdateService = new ProductUpdateService(
  store,
  updateProduct,
);
