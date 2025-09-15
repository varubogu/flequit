import type { Account } from '$lib/types/account';
import type { AccountInterface } from '$lib/types/crud-interface';

/**
 * アカウント管理用のバックエンドサービスインターフェース
 */
export type AccountService = AccountInterface<Account, Partial<Account>>;
