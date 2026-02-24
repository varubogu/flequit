/**
 * @deprecated 互換性維持用。新規コードは `$lib/services/domain/current-user-id` を使用してください。
 */
// eslint-disable-next-line no-restricted-imports
import { getCurrentUserId as getCurrentUserIdFromDomain } from '$lib/services/domain/current-user-id';

export function getCurrentUserId(): string {
  return getCurrentUserIdFromDomain();
}
