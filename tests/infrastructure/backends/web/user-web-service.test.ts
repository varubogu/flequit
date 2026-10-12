import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserWebService } from '$lib/infrastructure/backends/web/user-web-service';
import type { User } from '$lib/types/user';

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

describe('UserWebService', () => {
  const service = new UserWebService();

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('reports that the web user API is not implemented', async () => {
    await expect(service.create(user)).resolves.toBe(false);
    await expect(service.get('user-1')).resolves.toBeNull();
    await expect(service.update(user)).resolves.toBe(false);
    await expect(service.delete('user-1')).resolves.toBe(false);
    expect(console.warn).toHaveBeenCalledTimes(4);
  });
});
