import { FindOperator, Raw } from 'typeorm';

/**
 * Match a boolean column against an explicit SQLite integer (1/0).
 *
 * react-native-nitro-sqlite on Android binds boolean `true` as the string
 * 'true', which SQLite casts to 0, so `where: { isInput: true }` matches
 * nothing. Emitting the integer literal keeps the comparison correct on
 * every platform without casting the value through `any`.
 */
export const sqliteBoolean = (value: boolean): FindOperator<boolean> =>
  Raw<boolean>(alias => `${alias} = ${value ? 1 : 0}`);
