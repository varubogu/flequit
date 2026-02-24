import type { User } from '$lib/types/user';
import { resolveBackend } from '$lib/infrastructure/backend-client';
import { getCurrentUserId } from '$lib/services/domain/current-user-id';

export const UserService = {
  async update(user: User): Promise<boolean> {
    const backend = await resolveBackend();
    return backend.user.update(user, getCurrentUserId());
  }
};
