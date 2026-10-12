import { describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/services/domain/subtask');

describe('subtask domain facade', () => {
  it('reuses one operations instance and binds callable methods', async () => {
    const { getSubTaskOperations, subTaskOperations } = await import('$lib/services/domain/subtask');

    const first = getSubTaskOperations();
    const second = getSubTaskOperations();

    expect(second).toBe(first);
    expect(subTaskOperations.addSubTask).toEqual(expect.any(Function));
    expect(subTaskOperations.addSubTask).not.toBe(first.addSubTask);
  });

  it('returns non-function properties without binding them', async () => {
    const { subTaskOperations } = await import('$lib/services/domain/subtask');
    const missing = (subTaskOperations as unknown as Record<string, unknown>).notARealProperty;
    expect(missing).toBeUndefined();
  });
});
