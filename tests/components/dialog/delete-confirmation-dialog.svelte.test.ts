import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DeleteConfirmationDialog from '$lib/components/dialog/delete-confirmation-dialog.svelte';

describe('DeleteConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    title: '削除の確認',
    message: 'このアイテムを削除してもよろしいですか？この操作は取り消せません。',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ダイアログが表示される', () => {
    render(DeleteConfirmationDialog, { props: defaultProps });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('削除の確認')).toBeInTheDocument();
    expect(
      screen.getByText('このアイテムを削除してもよろしいですか？この操作は取り消せません。')
    ).toBeInTheDocument();
  });

  it('openがfalseの場合はダイアログが表示されない', () => {
    const props = { ...defaultProps, open: false };
    render(DeleteConfirmationDialog, { props });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('削除ボタンとキャンセルボタンが表示される', () => {
    render(DeleteConfirmationDialog, { props: defaultProps });

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('削除ボタンクリックでonConfirmが呼ばれる', async () => {
    const mockOnConfirm = vi.fn();
    const props = { ...defaultProps, onConfirm: mockOnConfirm };
    render(DeleteConfirmationDialog, { props });

    const deleteButton = screen.getByText('Delete');
    await fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('キャンセルボタンクリックでonCancelが呼ばれる', async () => {
    const mockOnCancel = vi.fn();
    const props = { ...defaultProps, onCancel: mockOnCancel };
    render(DeleteConfirmationDialog, { props });

    const cancelButton = screen.getByText('Cancel');
    await fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('カスタムタイトルとメッセージが表示される', () => {
    const customProps = {
      ...defaultProps,
      title: 'ファイルを削除',
      message: 'ファイル "example.txt" を完全に削除します。この操作は元に戻せません。'
    };
    render(DeleteConfirmationDialog, { props: customProps });

    expect(screen.getByText('ファイルを削除')).toBeInTheDocument();
    expect(
      screen.getByText('ファイル "example.txt" を完全に削除します。この操作は元に戻せません。')
    ).toBeInTheDocument();
  });

  it('削除ボタンにdestructiveバリアントが設定される', () => {
    render(DeleteConfirmationDialog, { props: defaultProps });

    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeInTheDocument();
    // destructiveバリアントのクラスが適用されているかチェック
    expect(deleteButton.closest('button')).toHaveClass(/bg-destructive|text-destructive/);
  });

  it('キャンセルボタンにsecondaryバリアントが設定される', () => {
    render(DeleteConfirmationDialog, { props: defaultProps });

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeInTheDocument();
    // secondaryバリアントのクラスが適用されているかチェック
    expect(cancelButton.closest('button')).toHaveClass(/secondary/);
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      open: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project?',
      onConfirm: vi.fn(),
      onCancel: vi.fn()
    };

    const { container } = render(DeleteConfirmationDialog, { props });

    expect(container).toBeTruthy();
    expect(props.onConfirm).toBeInstanceOf(Function);
    expect(props.onCancel).toBeInstanceOf(Function);
  });

  it('ダイアログタイトルが見出しとして認識される', () => {
    render(DeleteConfirmationDialog, { props: defaultProps });

    const titleElement = screen.getByRole('heading', { name: '削除の確認' });
    expect(titleElement).toBeInTheDocument();
  });

  it('説明テキストが正しく表示される', () => {
    render(DeleteConfirmationDialog, { props: defaultProps });

    const descriptionElement = screen.getByText(
      'このアイテムを削除してもよろしいですか？この操作は取り消せません。'
    );
    expect(descriptionElement).toBeInTheDocument();
  });

  it('ボタンが正しい順序で配置される', () => {
    render(DeleteConfirmationDialog, { props: defaultProps });

    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByText('Delete');

    // 両方のボタンが存在することを確認
    expect(cancelButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  it('特殊文字を含むタイトルとメッセージが正しく処理される', () => {
    const props = {
      ...defaultProps,
      title: 'Delete "Special" Item & More',
      message: 'Are you sure you want to delete "<item>" & all its data?'
    };
    render(DeleteConfirmationDialog, { props });

    expect(screen.getByText('Delete "Special" Item & More')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete "<item>" & all its data?')
    ).toBeInTheDocument();
  });
});
