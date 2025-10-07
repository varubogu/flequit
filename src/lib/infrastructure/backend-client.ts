import type { BackendService } from '$lib/infrastructure/backends';
import { getBackendService } from '$lib/infrastructure/backends';

let backendPromise: Promise<BackendService> | null = null;

/**
 * Memoized backend service getter. Ensures backend initialization occurs once.
 */
export function resolveBackend(): Promise<BackendService> {
  if (!backendPromise) {
    backendPromise = getBackendService();
  }
  return backendPromise;
}

/**
 * Reset the cached backend instance (mainly for testing).
 */
export function resetBackendCache() {
  backendPromise = null;
}
