import type { User } from '$lib/types/user';
import type { UserService } from '$lib/infrastructure/backends/user-service';

export class UserWebService implements UserService {
  async create(user: User): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: createUser not implemented', user);
    return false; // 仮実装として失敗を返す
  }

  async get(id: string): Promise<User | null> {
    // TODO: Web API実装を追加
    console.warn('Web backends: getUser not implemented', id);
    return null; // 仮実装としてnullを返す
  }

  async update(user: User): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: updateUser not implemented', user);
    return false; // 仮実装として失敗を返す
  }

  async delete(userId: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backends: deleteUser not implemented', userId);
    return false; // 仮実装として失敗を返す
  }
}
