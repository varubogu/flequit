import { describe, expect, it } from 'vitest';
import { BackendError, isBackendError, toBackendError } from '$lib/infrastructure/backend-error';

describe('BackendError', () => {
  const context = { operation: 'load', resourceType: 'task', resourceId: 'task-1' };

  it('stores category, context, and cause', () => {
    const cause = new Error('root');
    const error = new BackendError('failed', { category: 'network', context, cause });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BackendError');
    expect(error.message).toBe('failed');
    expect(error.category).toBe('network');
    expect(error.context).toBe(context);
    expect(error.cause).toBe(cause);
    expect(isBackendError(error)).toBe(true);
    expect(isBackendError(cause)).toBe(false);
  });

  it('defaults the category to unknown', () => {
    const error = new BackendError('failed', { context });
    expect(error.category).toBe('unknown');
  });

  it('returns an existing BackendError unchanged', () => {
    const error = new BackendError('failed', { category: 'conflict', context });
    expect(toBackendError(error, { operation: 'other' }, 'timeout')).toBe(error);
  });

  it('wraps Error and unknown values', () => {
    const original = new Error('boom');
    const wrapped = toBackendError(original, context, 'timeout');
    expect(wrapped.message).toBe('boom');
    expect(wrapped.category).toBe('timeout');
    expect(wrapped.cause).toBe(original);

    const fromString = toBackendError('plain', context);
    expect(fromString.message).toBe('plain');
    expect(fromString.category).toBe('unknown');
    expect(fromString.cause).toBe('plain');
  });
});
