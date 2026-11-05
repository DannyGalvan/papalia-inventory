import { SequentialProductCodeGenerator } from '../../../../src/services/product/SequentialProductCodeGenerator';
import { ProductCodeSequenceStore } from '../../../../src/services/product/types';

const memoryStore = (codes: string[] = [], last = 0) => {
  const state = { codes, last };
  const store: ProductCodeSequenceStore = {
    findCodesWithPrefix: jest.fn(async (prefix: string) =>
      state.codes.filter(c => c.startsWith(prefix)),
    ),
    getLastSequence: jest.fn(async () => state.last),
    saveLastSequence: jest.fn(async (value: number) => {
      state.last = value;
    }),
  };
  return { store, state };
};

describe('SequentialProductCodeGenerator', () => {
  const generator = new SequentialProductCodeGenerator();

  it('starts at PRD-000001 on an empty catalog', async () => {
    const { store } = memoryStore();
    await expect(generator.reserve(store)).resolves.toBe('PRD-000001');
  });

  it('peek does not reserve', async () => {
    const { store, state } = memoryStore();
    await expect(generator.peek(store)).resolves.toBe('PRD-000001');
    await expect(generator.peek(store)).resolves.toBe('PRD-000001');
    expect(state.last).toBe(0);
    expect(store.saveLastSequence).not.toHaveBeenCalled();
  });

  it('reserve advances and persists the sequence', async () => {
    const { store, state } = memoryStore();
    await generator.reserve(store);
    await expect(generator.reserve(store)).resolves.toBe('PRD-000002');
    expect(state.last).toBe(2);
  });

  it('never reuses a reserved number (deleted products)', async () => {
    const { store } = memoryStore([], 7);
    await expect(generator.reserve(store)).resolves.toBe('PRD-000008');
  });

  it('continues after existing generated-looking codes', async () => {
    const { store } = memoryStore(['PRD-000040', 'P-0099', 'PRD-000003'], 5);
    await expect(generator.reserve(store)).resolves.toBe('PRD-000041');
  });

  it('supports a custom format', async () => {
    const custom = new SequentialProductCodeGenerator({
      prefix: 'INV',
      digits: 3,
    });
    const { store } = memoryStore(['INV009']);
    await expect(custom.reserve(store)).resolves.toBe('INV010');
    expect(store.findCodesWithPrefix).toHaveBeenCalledWith('INV');
  });
});
