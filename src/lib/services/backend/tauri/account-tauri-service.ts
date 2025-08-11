import { invoke } from '@tauri-apps/api/core';
import type { Account } from '$lib/types/task';
import type { AccountService } from '$lib/services/backend/account-service';

export class TauriAccountService implements AccountService {
  async get(id: string): Promise<Account | null> {
    try {
      const result = await invoke('get_account', { id }) as Account | null;
      return result;
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  async update(account: Account): Promise<boolean> {
    try {
      await invoke('update_account', { account });
      return true;
    } catch (error) {
      console.error('Failed to update account:', error);
      return false;
    }
  }
}