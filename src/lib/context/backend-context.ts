import { setContext, getContext } from 'svelte';
import type { BackendService } from '$lib/infrastructure/backends';
import { resolveBackend } from '$lib/infrastructure/backend-client';

const BACKEND_CONTEXT = Symbol('backend-service');

export type BackendContextValue = {
  service: Promise<BackendService>;
};

export function initBackendContext() {
  const value: BackendContextValue = {
    service: resolveBackend()
  };
  setContext(BACKEND_CONTEXT, value);
  return value;
}

export function useBackendContext() {
  const value = getContext<BackendContextValue | undefined>(BACKEND_CONTEXT);
  if (!value) {
    throw new Error(
      'Backend context has not been initialized. Make sure initBackendContext() is called at the top level.'
    );
  }
  return value;
}
