import { describe, expect, it } from 'vitest';
import { getTaskOperations, taskOperations } from '$lib/services/domain/task';

describe('task domain facade', () => {
  it('reuses one operations instance and binds callable methods', () => {
    const first = getTaskOperations();
    const second = getTaskOperations();

    expect(second).toBe(first);
    expect(taskOperations.addTask).toEqual(expect.any(Function));
    expect(taskOperations.addTask).not.toBe(first.addTask);
  });

  it('returns non-function properties without binding them', () => {
    const missing = (taskOperations as unknown as Record<string, unknown>).notARealProperty;
    expect(missing).toBeUndefined();
  });
});
