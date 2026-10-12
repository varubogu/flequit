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

  it('空の任意項目は空欄で表示し、空白のまま保存すると元の値を残す', async () => {
    const sparseUser = {
      ...baseUser,
      handleId: '',
      displayName: '',
      email: undefined,
      bio: undefined,
      timezone: undefined
    } as User;
    const { unmount } = render(UserProfileEditDialog, {
      props: { user: sparseUser, isOpen: true, onClose: vi.fn() }
    });

    expect(screen.getByLabelText('Username')).toHaveValue('');
    expect(screen.getByLabelText('Display Name')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Bio')).toHaveValue('');
    expect(screen.getByLabelText('Timezone')).toHaveValue('');
    unmount();

    render(UserProfileEditDialog, {
      props: { user: baseUser, isOpen: true, onClose: vi.fn() }
    });
    await fireEvent.input(screen.getByLabelText('Username'), { target: { value: '   ' } });
    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: '   ' } });
    await fireEvent.input(screen.getByLabelText('Bio'), { target: { value: '   ' } });
    await fireEvent.input(screen.getByLabelText('Timezone'), { target: { value: '   ' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
    });
    expect(mockUpdateUser.mock.calls.at(-1)?.[0]).toMatchObject({
      handleId: baseUser.handleId,
      email: baseUser.email,
      bio: baseUser.bio,
      timezone: baseUser.timezone
    });
  });

  it('保存中は再保存と閉じる操作を無視し、Escape以外のキーでは閉じない', async () => {
    let resolveUpdate: (success: boolean) => void = () => {};
    mockUpdateUser.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveUpdate = resolve;
        })
    );
    const onClose = vi.fn();
    render(UserProfileEditDialog, {
      props: { user: baseUser, isOpen: true, onClose }
    });

    await fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: '保存中...' })).toBeDisabled();

    await fireEvent.click(screen.getByRole('button', { name: '保存中...' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    resolveUpdate(true);
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('ユーザーが無いときは編集フォームを出さない', () => {
    render(UserProfileEditDialog, {
      props: { user: null, isOpen: true, onClose: vi.fn() }
    });

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
  });
});
