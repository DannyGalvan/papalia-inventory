/**
 * Property-based tests for Input/Output log form validation.
 *
 * Feature: app-modernization
 *   Property 7: Type selection validation rejects unselected value — for any
 *               Input or Output form state where the `type` field equals 0
 *               ("no seleccionado"), the form validation function must return a
 *               validation error (preventing submission) regardless of the
 *               values present in any other form field.
 *
 * Validates: Requirements 7.6
 *
 * The predicate under test is the pure `validateLogForm` function from
 * `src/utils/validateLogForm.ts`. That module imports the `LogHeader` entity,
 * which transitively pulls TypeORM's decorators. Under Jest, TypeORM resolves
 * to its ESM `browser` build which Jest cannot transpile cleanly, so — matching
 * the pattern used by ExcelService.property.test.ts — the `typeorm` module is
 * replaced with no-op decorator factories. The decorators have no bearing on
 * the pure validation logic under test.
 *
 * Each property runs a minimum of 100 iterations via fast-check.
 */

import fc from 'fast-check';

// ---------------------------------------------------------------------------
// TypeORM decorator no-op mock (see file header for rationale).
// ---------------------------------------------------------------------------
jest.mock('typeorm', () => {
  const noopDecorator =
    () =>
    (..._args: unknown[]): void => {};
  const decoratorFactory =
    (..._factoryArgs: unknown[]) =>
    (..._args: unknown[]): void => {};
  return {
    Entity: decoratorFactory,
    Column: decoratorFactory,
    PrimaryColumn: decoratorFactory,
    PrimaryGeneratedColumn: decoratorFactory,
    OneToMany: decoratorFactory,
    ManyToOne: decoratorFactory,
    JoinColumn: decoratorFactory,
    CreateDateColumn: decoratorFactory,
    UpdateDateColumn: decoratorFactory,
    Index: decoratorFactory,
    Unique: decoratorFactory,
    Generated: noopDecorator,
  };
});

// Imports must come after jest.mock so the mocked module is wired in.
import { LogHeader } from '../../../src/database/models/LogHeader';
import {
    LOG_FORM_MESSAGES,
    UNSELECTED_TYPE,
    validateLogForm,
} from '../../../src/utils/validateLogForm';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Arbitrary "other field" values for a LogHeader form state — everything
 * except `type`. Covers empty and non-empty comments, empty and non-empty
 * logDetails arrays, arbitrary timestamps, both input/output flags, and any id.
 * Each `logDetails` element is a loosely-shaped object: validation only ever
 * inspects the array length, so the element contents are intentionally varied.
 */
const otherFieldsArbitrary = fc.record({
  id: fc.integer({ min: 0, max: 1_000_000 }),
  comments: fc.string(),
  createdAt: fc.date().map(d => (Number.isNaN(d.getTime()) ? new Date(0) : d)),
  isInput: fc.boolean(),
  logDetails: fc.array(
    fc.record({
      id: fc.integer({ min: 0, max: 1000 }),
      name: fc.string(),
      quantity: fc.integer({ min: 0, max: 1000 }),
    }),
    { minLength: 0, maxLength: 10 },
  ),
});

// ---------------------------------------------------------------------------
// Anchor unit tests (concrete examples)
// ---------------------------------------------------------------------------

describe('validateLogForm — type selection examples', () => {
  it('rejects type=0 even when every other field is valid', () => {
    const form = {
      id: 1,
      type: UNSELECTED_TYPE,
      comments: 'Compra de inventario',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      isInput: true,
      logDetails: [{ id: 1, name: 'Tornillo', quantity: 10 }],
    } as unknown as LogHeader;

    const errors = validateLogForm(form);

    expect(errors.type).toBe(LOG_FORM_MESSAGES.type);
    expect(errors.type).toBe('Debe seleccionar un tipo');
  });

  it('rejects type=0 even when every other field is empty/invalid', () => {
    const form = {
      id: 0,
      type: UNSELECTED_TYPE,
      comments: '',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      isInput: false,
      logDetails: [],
    } as unknown as LogHeader;

    const errors = validateLogForm(form);

    expect(errors.type).toBe(LOG_FORM_MESSAGES.type);
  });

  it('does not produce a type error when a real type is selected', () => {
    const form = {
      id: 1,
      type: 3,
      comments: 'Venta',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      isInput: false,
      logDetails: [{ id: 1, name: 'Martillo', quantity: 1 }],
    } as unknown as LogHeader;

    const errors = validateLogForm(form);

    expect(errors.type).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Property 7: Type selection validation rejects unselected value
// ---------------------------------------------------------------------------

describe('Feature: app-modernization, Property 7: Type selection validation rejects unselected value', () => {
  it('always returns the type error when type=0, regardless of other fields', () => {
    fc.assert(
      fc.property(otherFieldsArbitrary, other => {
        const form = {
          type: UNSELECTED_TYPE,
          ...other,
        } as unknown as LogHeader;

        const errors = validateLogForm(form);

        // The type error must be a defined, non-empty Spanish string equal to
        // the canonical message — proving submission is blocked for type=0.
        expect(typeof errors.type).toBe('string');
        expect(errors.type).toBe(LOG_FORM_MESSAGES.type);
        expect((errors.type as string).length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('never returns a type error when type !== 0, isolating the type rule to the type field', () => {
    fc.assert(
      fc.property(
        // A selected type is any non-zero option value (1..N).
        fc.integer({ min: 1, max: 50 }),
        otherFieldsArbitrary,
        (selectedType, other) => {
          const form = {
            type: selectedType,
            ...other,
          } as unknown as LogHeader;

          const errors = validateLogForm(form);

          expect(errors.type).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
