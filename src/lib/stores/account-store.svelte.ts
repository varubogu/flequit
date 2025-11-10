import { type Account } from '$lib/types/account';

/**
 * 現在のアカウント情報を管理するストア
 */
class AccountStore {
  #currentAccount = $state<Account | null>(null);

  get currentAccount(): Account | null {
    return this.#currentAccount;
  }

  get currentUserId(): string | null {
    return this.#currentAccount?.userId ?? null;
  }

  setCurrentAccount(account: Account | null) {
    this.#currentAccount = account;
  }

  clearAccount() {
    this.#currentAccount = null;
  }
}

export const accountStore = new AccountStore();
