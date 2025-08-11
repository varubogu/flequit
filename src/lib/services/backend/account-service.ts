import type { Account } from '$lib/types/settings';
import type { AccountInterface } from '$lib/types/crud-interface';

/**
 * アカウント管理用のバックエンドサービスインターフェース
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AccountService extends AccountInterface<Account> {}
