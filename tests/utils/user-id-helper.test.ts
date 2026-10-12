import { describe, expect, it } from 'vitest';
import { getCurrentUserId } from '$lib/utils/user-id-helper';

describe('user-id-helper', () => {
  it('delegates to the domain current user id', () => {
    expect(getCurrentUserId()).toEqual(expect.any(String));
  });
});
