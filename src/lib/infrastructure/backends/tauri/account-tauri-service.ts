import { invoke } from '@tauri-apps/api/core';
import type { Account } from '$lib/types/account';
import type { AccountService } from '$lib/infrastructure/backends/account-service';

export class AccountTauriService implements AccountService {
  async create(account: Account, userId: string): Promise<boolean> {
    try {
      await invoke('create_account', { account, userId });
      return true;
    } catch (error) {
      console.error('Failed to create account:', error);
      return false;
    }
  }

  async get(id: string, userId: string): Promise<Account | null> {
    try {
      const result = (await invoke('get_account', { id, userId })) as Account | null;
      return result;
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  async update(id: string, patch: Partial<Account>, userId: string): Promise<boolean> {
    try {
      const result = await invoke('update_account', { id, patch, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update account:', error);
      return false;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_account', { accountId: id, userId });
      return true;
    } catch (error) {
      console.error('Failed to delete account:', error);
      return false;
    }
  }
}
