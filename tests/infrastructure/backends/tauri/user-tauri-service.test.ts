import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserTauriService } from '$lib/infrastructure/backends/tauri/user-tauri-service';
import type { User } from '$lib/types/user';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

const mockInvoke = vi.mocked((await import('@tauri-apps/api/core')).invoke);

const user = {
  id: 'user-1',
  handleId: 'ada',
  displayName: 'Ada',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  deleted: false,
  updatedBy: 'user-1'
} satisfies User;

describe('UserTauriService', () => {
  const service = new UserTauriService();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates, reads, updates, and deletes a user', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(user);
    mockInvoke.mockResolvedValueOnce(true);
    mockInvoke.mockResolvedValueOnce(undefined);

    await expect(service.create(user, 'actor')).resolves.toBe(true);
    await expect(service.get('user-1', 'actor')).resolves.toBe(user);
    await expect(service.update(user, 'actor')).resolves.toBe(true);
    await expect(service.delete('user-1', 'actor')).resolves.toBe(true);

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'create_user', { user, userId: 'actor' });
    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'get_user', { id: 'user-1', userId: 'actor' });
    expect(mockInvoke).toHaveBeenNthCalledWith(3, 'update_user', { user, userId: 'actor' });
    expect(mockInvoke).toHaveBeenNthCalledWith(4, 'delete_user', {
      userId: 'user-1',
      deletedByUserId: 'actor'
    });
  });

  it('returns a safe failure when invoke rejects', async () => {
    mockInvoke.mockRejectedValue(new Error('offline'));

    await expect(service.create(user, 'actor')).resolves.toBe(false);
    await expect(service.get('user-1', 'actor')).resolves.toBeNull();
    await expect(service.update(user, 'actor')).resolves.toBe(false);
    await expect(service.delete('user-1', 'actor')).resolves.toBe(false);
  });
});
