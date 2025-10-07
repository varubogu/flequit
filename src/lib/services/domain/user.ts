import type { User } from '$lib/types/user';
import { resolveBackend } from '$lib/infrastructure/backend-client';

export const UserService = {
  async update(user: User): Promise<boolean> {
    const backend = await resolveBackend();
    return backend.user.update(user);
  }
};
