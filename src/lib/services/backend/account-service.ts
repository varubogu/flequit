import type { Account, AccountPatch } from '$lib/types/account';
import type { AccountInterface } from '$lib/types/crud-interface';

/**
 * アカウント管理用のバックエンドサービスインターフェース
 */
export type AccountService = AccountInterface<Account, AccountPatch>;
