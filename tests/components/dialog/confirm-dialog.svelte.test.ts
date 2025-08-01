import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ConfirmDialog from '$lib/components/dialog/confirm-dialog.svelte';

describe('ConfirmDialog', () => {
  const defaultProps = {
    show: true,
    title: 'テスト確認',
    message: 'この操作を実行してもよろしいですか？',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ダイアログが表示される', () => {
    render(ConfirmDialog, { props: defaultProps });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('テスト確認')).toBeInTheDocument();
    expect(screen.getByText('この操作を実行してもよろしいですか？')).toBeInTheDocument();
  });

  it('showがfalseの場合はダイアログが表示されない', () => {
    const props = { ...defaultProps, show: false };
    render(ConfirmDialog, { props });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('確認ボタンとキャンセルボタンが表示される', () => {
    render(ConfirmDialog, { props: defaultProps });

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('確認ボタンクリックでonConfirmが呼ばれる', async () => {
    const mockOnConfirm = vi.fn();
    const props = { ...defaultProps, onConfirm: mockOnConfirm };
    render(ConfirmDialog, { props });

    const confirmButton = screen.getByTitle('Confirm');
    await fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('キャンセルボタンクリックでonCancelが呼ばれる', async () => {
    const mockOnCancel = vi.fn();
    const props = { ...defaultProps, onCancel: mockOnCancel };
    render(ConfirmDialog, { props });

    const cancelButton = screen.getByTitle('Cancel');
    await fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('カスタム確認ボタンテキストが設定される', () => {
    const props = { ...defaultProps, confirmText: '実行' };
    render(ConfirmDialog, { props });

    const confirmButton = screen.getByTitle('実行');
    expect(confirmButton).toBeInTheDocument();
  });

  it('カスタムキャンセルボタンテキストが設定される', () => {
    const props = { ...defaultProps, cancelText: '戻る' };
    render(ConfirmDialog, { props });

    const cancelButton = screen.getByTitle('戻る');
    expect(cancelButton).toBeInTheDocument();
  });

  it('デフォルトボタンテキストが使用される', () => {
    render(ConfirmDialog, { props: defaultProps });

    expect(screen.getByTitle('Confirm')).toBeInTheDocument();
    expect(screen.getByTitle('Cancel')).toBeInTheDocument();
  });

  it('タイトルとメッセージが正しく表示される', () => {
    const customProps = {
      ...defaultProps,
      title: 'カスタムタイトル',
      message: 'カスタムメッセージです。'
    };
    render(ConfirmDialog, { props: customProps });

    expect(screen.getByText('カスタムタイトル')).toBeInTheDocument();
    expect(screen.getByText('カスタムメッセージです。')).toBeInTheDocument();
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      show: true,
      title: 'Test Title',
      message: 'Test Message',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: vi.fn(),
      onCancel: vi.fn()
    };

    const { container } = render(ConfirmDialog, { props });

    expect(container).toBeTruthy();
    expect(props.onConfirm).toBeInstanceOf(Function);
    expect(props.onCancel).toBeInstanceOf(Function);
  });
});
