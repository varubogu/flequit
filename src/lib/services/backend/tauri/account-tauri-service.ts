import { invoke } from '@tauri-apps/api/core';
import type { Account, AccountPatch } from '$lib/types/account';
import type { AccountService } from '$lib/services/backend/account-service';

export class AccountTauriService implements AccountService {
  async create(account: Account): Promise<boolean> {
    try {
      await invoke('create_account', { account });
      return true;
    } catch (error) {
      console.error('Failed to create account:', error);
      return false;
    }
  }

  async get(id: string): Promise<Account | null> {
    try {
      const result = (await invoke('get_account', { id })) as Account | null;
      return result;
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  async update(id: string, patch: AccountPatch): Promise<boolean> {
    try {
      const result = await invoke('update_account', { id, patch });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update account:', error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await invoke('delete_account', { account_id: id });
      return true;
    } catch (error) {
      console.error('Failed to delete account:', error);
      return false;
    }
  }
}
