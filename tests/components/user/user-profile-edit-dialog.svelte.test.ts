import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import UserProfileEditDialog from '$lib/components/user/user-profile-edit-dialog.svelte';
import type { User } from '$lib/types/user';

const { mockUpdateUser, mockAddError } = vi.hoisted(() => ({
  mockUpdateUser: vi.fn(),
  mockAddError: vi.fn()
}));

vi.mock('$lib/hooks/use-translation.svelte', () => ({
  useTranslation: () => ({
    getMessage: (key: string) => () =>
      (
        {
          edit_profile: 'Edit Profile',
          username: 'Username',
          display_name: 'Display Name',
          email: 'Email',
          bio: 'Bio',
          timezone: 'Timezone',
          cancel: 'Cancel',
          save: 'Save'
        } as Record<string, string>
      )[key] ?? key
  })
}));

vi.mock('$lib/services/domain/user', () => ({
  UserService: {
    update: mockUpdateUser
  }
}));

vi.mock('$lib/stores/error-handler.svelte', () => ({
  errorHandler: {
    addError: mockAddError
  }
}));

describe('UserProfileEditDialog', () => {
  const baseUser: User = {
    id: 'user-1',
    handleId: 'john-handle',
    displayName: 'John Doe',
    email: 'john@example.com',
    bio: 'Hello',
    timezone: 'Asia/Tokyo',
    isActive: true,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    deleted: false,
    updatedBy: 'user-1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateUser.mockResolvedValue(true);
  });

  it('ユーザー情報をフォームに表示する', () => {
    render(UserProfileEditDialog, {
      props: {
        user: baseUser,
        isOpen: true,
        onClose: vi.fn()
      }
    });

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john-handle')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Asia/Tokyo')).toBeInTheDocument();
  });

  it('保存成功時に更新APIを呼び出し、onSaveとonCloseを実行する', async () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    render(UserProfileEditDialog, {
      props: {
        user: baseUser,
        isOpen: true,
        onClose,
        onSave
      }
    });

    await fireEvent.input(screen.getByLabelText('Username'), {
      target: { value: '  next-handle  ' }
    });
    await fireEvent.input(screen.getByLabelText('Display Name'), {
      target: { value: '   ' }
    });
    await fireEvent.input(screen.getByLabelText('Email'), {
      target: { value: '  next@example.com  ' }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    });

    const [updatedUser] = mockUpdateUser.mock.calls[0];
    expect(updatedUser).toMatchObject({
      id: baseUser.id,
      isActive: baseUser.isActive,
      createdAt: baseUser.createdAt,
      deleted: baseUser.deleted,
      updatedBy: baseUser.updatedBy,
      bio: baseUser.bio,
      timezone: baseUser.timezone,
      handleId: 'next-handle',
      displayName: 'John Doe',
      email: 'next@example.com'
    });
    expect(updatedUser.updatedAt).toEqual(expect.any(String));
    expect(onSave).toHaveBeenCalledWith(updatedUser);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('更新APIがfalseを返した場合はエラーを通知する', async () => {
    mockUpdateUser.mockResolvedValueOnce(false);
    const onClose = vi.fn();

    render(UserProfileEditDialog, {
      props: {
        user: baseUser,
        isOpen: true,
        onClose
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockAddError).toHaveBeenCalledWith({
        type: 'general',
        message: 'プロフィール保存に失敗しました',
        retryable: false
      });
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('更新APIで例外が発生した場合はエラーを通知する', async () => {
    mockUpdateUser.mockRejectedValueOnce(new Error('save failed'));

    render(UserProfileEditDialog, {
      props: {
        user: baseUser,
        isOpen: true,
        onClose: vi.fn()
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockAddError).toHaveBeenCalledWith({
        type: 'general',
        message: 'プロフィール保存中にエラーが発生しました',
        retryable: false
      });
    });
  });

  it('CancelクリックとEscapeキーでダイアログを閉じる', async () => {
    const onClose = vi.fn();

    render(UserProfileEditDialog, {
      props: {
        user: baseUser,
        isOpen: true,
        onClose
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
