import { getCurrentUserId } from '$lib/services/domain/current-user-id';

export type CurrentUserIdProvider = () => string;

export function resolveCurrentUserIdProvider(): CurrentUserIdProvider {
  return getCurrentUserId;
}
