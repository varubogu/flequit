import type { Account } from '$lib/types/settings';
import type { AccountService } from '$lib/services/backend/account-service';

export class AccountWebService implements AccountService {
  async create(account: Account): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: createAccount not implemented', account);
    return false; // 仮実装として失敗を返す
  }

  async get(id: string): Promise<Account | null> {
    // TODO: Web API実装を追加
    console.warn('Web backend: getAccount not implemented', id);
    return null; // 仮実装としてnullを返す
  }

  async update(account: Account): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: updateAccount not implemented', account);
    return false; // 仮実装として失敗を返す
  }

  async delete(id: string): Promise<boolean> {
    // TODO: Web API実装を追加
    console.warn('Web backend: deleteAccount not implemented', id);
    return false; // 仮実装として失敗を返す
  }
}
