import { typeormSqlExecutor } from '../../database/connection/typeormSqlExecutor';
import { SqlMovementCancellationStore } from '../../database/repository/SqlMovementCancellationStore';
import { MovementCancellationService } from './MovementCancellationService';

/** App-wide instance wired to the SQLite database (composition root). */
export const movementCancellationService = new MovementCancellationService(
  new SqlMovementCancellationStore(typeormSqlExecutor),
);
