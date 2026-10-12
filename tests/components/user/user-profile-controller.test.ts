import { flushSync } from 'svelte';
import { effect_root } from 'svelte/internal/client';
import { describe, expect, it, vi } from 'vitest';
import { UserProfileController } from '$lib/components/user/user-profile-controller.svelte';
import type { User as FullUser } from '$lib/types/user';
import type { User } from '$lib/components/user/user-profile.svelte';

const fullUser = {
  id: 'user-1',
  handleId: 'hana',
  displayName: '',
  email: undefined,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deleted: false,
  updatedBy: 'user-1'
} as FullUser;

describe('UserProfileController', () => {
  it('copies a saved profile onto the local user and skips that copy when no local user exists', async () => {
    const localUser: User = { id: 'user-1', name: 'Old', email: 'old@example.com' };
    const onUserUpdated = vi.fn();
    const withUser = new UserProfileController({
      user: localUser,
      fullUser: null,
      onUserUpdated
    });

    await withUser.handleUserSaved({ ...fullUser, displayName: 'Hana', email: 'hana@example.com' });
    expect(localUser).toMatchObject({ name: 'Hana', email: 'hana@example.com' });
    expect(onUserUpdated).toHaveBeenCalledOnce();

    await withUser.handleUserSaved(fullUser);
    expect(localUser).toMatchObject({ name: 'hana', email: '' });

    const onNullUserUpdated = vi.fn();
    const withoutUser = new UserProfileController({
      user: null,
      fullUser: null,
      onUserUpdated: onNullUserUpdated
    });
    await withoutUser.handleUserSaved(fullUser);
    expect(onNullUserUpdated).toHaveBeenCalledOnce();
    expect(onUserUpdated).toHaveBeenCalledTimes(2);
  });

  it('closes the menu only for an outside click while it is open', () => {
    const controller = new UserProfileController({ user: null, fullUser: null });
    const outside = document.createElement('div');
    const inside = document.createElement('div');
    inside.className = 'user-profile-container';
    const child = document.createElement('button');
    inside.append(child);
    document.body.append(outside, inside);

    controller.showMenu = true;
    controller.handleClickOutside({ target: outside } as MouseEvent);
    expect(controller.showMenu).toBe(false);

    controller.showMenu = true;
    controller.handleClickOutside({ target: child } as MouseEvent);
    expect(controller.showMenu).toBe(true);

    controller.handleClickOutside({ target: null } as unknown as MouseEvent);
    expect(controller.showMenu).toBe(true);

    controller.showMenu = false;
    controller.handleClickOutside({ target: outside } as MouseEvent);
    expect(controller.showMenu).toBe(false);

    outside.remove();
    inside.remove();
  });

  it('registers the outside-click handler only while the menu is open', () => {
    const controller = new UserProfileController({ user: null, fullUser: null });
    const callback = vi.fn();
    const stop = effect_root(() => {
      controller.setupClickOutsideEffect(callback);
    });
    flushSync();
    expect(callback).not.toHaveBeenCalled();

    controller.showMenu = true;
    flushSync();
    expect(callback).toHaveBeenCalledWith(controller.handleClickOutside);

    controller.showMenu = false;
    flushSync();
    stop();
  });
});
