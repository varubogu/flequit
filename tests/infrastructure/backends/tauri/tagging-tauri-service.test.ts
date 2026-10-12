import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaggingTauriService } from '$lib/infrastructure/backends/tauri/tagging-tauri-service';
import type { Tag } from '$lib/types/tag';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked((await import('@tauri-apps/api/core')).invoke);

const tag = {
  id: 'tag-1',
  name: 'milk',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
} satisfies Tag;

describe('TaggingTauriService', () => {
  const service = new TaggingTauriService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates and deletes task and subtask tags', async () => {
    mockInvoke.mockResolvedValueOnce(tag);
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(tag);
    mockInvoke.mockResolvedValueOnce(undefined);

    await expect(service.createTaskTag('p1', 't1', 'milk', 'actor')).resolves.toBe(tag);
    await expect(service.deleteTaskTag('p1', 't1', 'tag-1', 'actor')).resolves.toBe(true);
    await expect(service.createSubtaskTag('p1', 's1', 'milk', 'actor')).resolves.toBe(tag);
    await expect(service.deleteSubtaskTag('p1', 's1', 'tag-1', 'actor')).resolves.toBe(true);
  });

  it('rethrows create failures and returns false when delete fails', async () => {
    const error = new Error('offline');
    mockInvoke.mockRejectedValue(error);

    await expect(service.createTaskTag('p1', 't1', 'milk', 'actor')).rejects.toBe(error);
    await expect(service.deleteTaskTag('p1', 't1', 'tag-1', 'actor')).resolves.toBe(false);
    await expect(service.createSubtaskTag('p1', 's1', 'milk', 'actor')).rejects.toBe(error);
    await expect(service.deleteSubtaskTag('p1', 's1', 'tag-1', 'actor')).resolves.toBe(false);
  });
});
