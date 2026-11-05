/**
 * No-op TypeORM decorators so entity classes can be imported under Jest
 * without the ESM browser build. Usage:
 * `jest.mock('typeorm', () => require('<path>/helpers/typeormDecoratorsMock'));`
 */
const decorator = () => () => {};

export const Entity = decorator;
export const PrimaryColumn = decorator;
export const PrimaryGeneratedColumn = decorator;
export const Column = decorator;
export const OneToMany = decorator;
export const ManyToOne = decorator;
export const JoinColumn = decorator;
