import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '$lib/types/user';

// ---------- モック ----------

const backendMock = {
  user: {
    update: vi.fn()
  }
};

vi.mock('$lib/infrastructure/backend-client', () => ({
  resolveBackend: vi.fn(async () => backendMock)
}));

vi.mock('$lib/services/domain/current-user-id', () => ({
  getCurrentUserId: vi.fn(() => 'current-user')
}));

// ---------- ヘルパー ----------

const now = new Date('2025-01-01T00:00:00.000Z');

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: now,
  updatedAt: now,
  deleted: false,
  updatedBy: 'current-user',
  ...overrides
});

// ---------- テスト ----------

const { UserService } = await import('$lib/services/domain/user');

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('update', () => {
    it('バックエンドを呼び出してユーザーを更新する', async () => {
      const user = buildUser({ name: 'Updated User' });
      backendMock.user.update.mockResolvedValue(true);

      const result = await UserService.update(user);

      expect(backendMock.user.update).toHaveBeenCalledWith(user, 'current-user');
      expect(result).toBe(true);
    });

    it('更新が失敗した場合はfalseを返す', async () => {
      const user = buildUser();
      backendMock.user.update.mockResolvedValue(false);

      const result = await UserService.update(user);

      expect(result).toBe(false);
    });

    it('バックエンドエラー時はエラーをスローする', async () => {
      const user = buildUser();
      backendMock.user.update.mockRejectedValue(new Error('Update failed'));

      await expect(UserService.update(user)).rejects.toThrow('Update failed');
    });
  });
});
