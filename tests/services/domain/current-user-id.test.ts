import { describe, it, expect, vi } from 'vitest';

// ---------- モック ----------

const accountStoreMock = {
  currentUserId: null as string | null
};

vi.mock('$lib/stores/account-store.svelte', () => ({
  accountStore: accountStoreMock
}));

// ---------- テスト ----------

const { getCurrentUserId } = await import('$lib/services/domain/current-user-id');

describe('getCurrentUserId', () => {
  it('ユーザーIDが存在する場合はそのIDを返す', () => {
    accountStoreMock.currentUserId = 'user-123';

    const result = getCurrentUserId();

    expect(result).toBe('user-123');
  });

  it('ユーザーIDがnullの場合は"system"を返す', () => {
    accountStoreMock.currentUserId = null;

    const result = getCurrentUserId();

    expect(result).toBe('system');
  });

  it('ユーザーIDがundefinedの場合は"system"を返す', () => {
    accountStoreMock.currentUserId = undefined as unknown as string | null;

    const result = getCurrentUserId();

    expect(result).toBe('system');
  });
});
