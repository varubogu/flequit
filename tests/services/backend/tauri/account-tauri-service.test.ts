import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountTauriService } from '$lib/services/backend/tauri/account-tauri-service';
import type { Account } from '$lib/types/account';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Get the mocked invoke for use in tests
const mockInvoke = vi.mocked(await import('@tauri-apps/api/core')).invoke;

describe('AccountTauriService', () => {
  let service: AccountTauriService;
  let mockAccount: Account;

  beforeEach(() => {
    service = new AccountTauriService();
    mockAccount = {
      id: 'account-123',
      userId: 'user-456',
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      provider: 'local',
      providerId: 'provider-123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create an account', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.create(mockAccount);

      expect(mockInvoke).toHaveBeenCalledWith('create_account', { account: mockAccount });
      expect(result).toBe(true);
    });

    it('should return false when creation fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Creation failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.create(mockAccount);

      expect(mockInvoke).toHaveBeenCalledWith('create_account', { account: mockAccount });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create account:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should successfully retrieve an account', async () => {
      mockInvoke.mockResolvedValue(mockAccount);

      const result = await service.get('account-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_account', { id: 'account-123' });
      expect(result).toEqual(mockAccount);
    });

    it('should return null when account not found', async () => {
      mockInvoke.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(mockInvoke).toHaveBeenCalledWith('get_account', { id: 'non-existent' });
      expect(result).toBeNull();
    });

    it('should return null when retrieval fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Retrieval failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.get('account-123');

      expect(mockInvoke).toHaveBeenCalledWith('get_account', { id: 'account-123' });
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get account:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should successfully update an account', async () => {
      mockInvoke.mockResolvedValue(true);

      const result = await service.update(mockAccount.id, mockAccount);

      expect(mockInvoke).toHaveBeenCalledWith('update_account', { id: mockAccount.id, patch: mockAccount });
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.update(mockAccount.id, mockAccount);

      expect(mockInvoke).toHaveBeenCalledWith('update_account', { id: mockAccount.id, patch: mockAccount });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update account:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should successfully delete an account', async () => {
      mockInvoke.mockResolvedValue(undefined);

      const result = await service.delete('account-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_account', { account_id: 'account-123' });
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockInvoke.mockRejectedValue(new Error('Deletion failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.delete('account-123');

      expect(mockInvoke).toHaveBeenCalledWith('delete_account', { account_id: 'account-123' });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete account:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
