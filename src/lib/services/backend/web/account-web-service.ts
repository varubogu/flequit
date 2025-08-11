import type { Account } from '$lib/types/task';
import type { AccountService } from '$lib/services/backend/account-service';

export class WebAccountService implements AccountService {
  async get(id: string): Promise<Account | null> {
    // TODO: Web API実装を追加
    console.log('Web backend: getAccount not implemented', id);
    throw new Error('Not implemented for web mode');
  }

  async update(account: Account): Promise<boolean> {
    // TODO: Web API実装を追加
    console.log('Web backend: updateAccount not implemented', account);
    throw new Error('Not implemented for web mode');
  }
}
