import { accountStore } from '$lib/stores/account-store.svelte';

/**
 * 現在のユーザーIDを取得します
 * アカウントが未ログインの場合は'system'を返します
 */
export function getCurrentUserId(): string {
  return accountStore.currentUserId ?? 'system';
}
