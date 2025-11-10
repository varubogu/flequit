import { invoke } from '@tauri-apps/api/core';
import type { User } from '$lib/types/user';
import type { UserService } from '$lib/infrastructure/backends/user-service';

export class UserTauriService implements UserService {
  async create(user: User, userId: string): Promise<boolean> {
    try {
      await invoke('create_user', { user, userId });
      return true;
    } catch (error) {
      console.error('Failed to create user:', error);
      return false;
    }
  }

  async get(id: string, userId: string): Promise<User | null> {
    try {
      const result = (await invoke('get_user', { id, userId })) as User | null;
      return result;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  async update(user: User, userId: string): Promise<boolean> {
    try {
      const result = await invoke('update_user', { user, userId });
      return result as boolean;
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      await invoke('delete_user', { userId: id, deletedByUserId: userId });
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }
}
