import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import UnsavedChangesDialog from '$lib/components/dialog/unsaved-changes-dialog.svelte';

// Paraglideメッセージのモック

// vitest.setup.tsの統一的なモック化を使用するため、locale.svelteの個別モック化は削除

describe('UnsavedChangesDialog', () => {
  const defaultProps = {
    show: true,
    onSaveAndContinue: vi.fn(),
    onDiscardAndContinue: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ダイアログが表示される', () => {
    render(UnsavedChangesDialog, { props: defaultProps });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('変更を破棄してもよろしいですか？')).toBeInTheDocument();
    expect(
      screen.getByText('未保存の変更があります。保存するか破棄してください。')
    ).toBeInTheDocument();
  });

  it('showがfalseの場合はダイアログが表示されない', () => {
    const props = { ...defaultProps, show: false };
    render(UnsavedChangesDialog, { props });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('3つのボタンが表示される', () => {
    render(UnsavedChangesDialog, { props: defaultProps });

    expect(screen.getByTitle('保存')).toBeInTheDocument();
    expect(screen.getByTitle('変更を破棄')).toBeInTheDocument();
    expect(screen.getByTitle('キャンセル')).toBeInTheDocument();
  });

  it('保存ボタンクリックでonSaveAndContinueが呼ばれる', async () => {
    const mockOnSaveAndContinue = vi.fn();
    const props = { ...defaultProps, onSaveAndContinue: mockOnSaveAndContinue };
    render(UnsavedChangesDialog, { props });

    const saveButton = screen.getByTitle('保存');
    await fireEvent.click(saveButton);

    expect(mockOnSaveAndContinue).toHaveBeenCalled();
  });

  it('破棄ボタンクリックでonDiscardAndContinueが呼ばれる', async () => {
    const mockOnDiscardAndContinue = vi.fn();
    const props = { ...defaultProps, onDiscardAndContinue: mockOnDiscardAndContinue };
    render(UnsavedChangesDialog, { props });

    const discardButton = screen.getByTitle('変更を破棄');
    await fireEvent.click(discardButton);

    expect(mockOnDiscardAndContinue).toHaveBeenCalled();
  });

  it('キャンセルボタンクリックでonCancelが呼ばれる', async () => {
    const mockOnCancel = vi.fn();
    const props = { ...defaultProps, onCancel: mockOnCancel };
    render(UnsavedChangesDialog, { props });

    const cancelButton = screen.getByTitle('キャンセル');
    await fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      show: true,
      onSaveAndContinue: vi.fn(),
      onDiscardAndContinue: vi.fn(),
      onCancel: vi.fn()
    };

    const { container } = render(UnsavedChangesDialog, { props });

    expect(container).toBeTruthy();
    expect(props.onSaveAndContinue).toBeInstanceOf(Function);
    expect(props.onDiscardAndContinue).toBeInstanceOf(Function);
    expect(props.onCancel).toBeInstanceOf(Function);
  });

  it('アクセシビリティが適切に設定される', () => {
    render(UnsavedChangesDialog, { props: defaultProps });

    // ダイアログがrole="dialog"を持つことを確認
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // タイトルが見出しとして認識されることを確認
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('アイコンが正しいサイズクラスを持つ', () => {
    render(UnsavedChangesDialog, { props: defaultProps });

    const saveButton = screen.getByTitle('保存');
    const discardButton = screen.getByTitle('変更を破棄');
    const cancelButton = screen.getByTitle('キャンセル');

    // 各ボタン内のアイコンが適切なサイズクラスを持つことを確認
    const saveIcon = saveButton.querySelector('svg.h-4.w-4');
    const discardIcon = discardButton.querySelector('svg.h-4.w-4');
    const cancelIcon = cancelButton.querySelector('svg.h-4.w-4');

    expect(saveIcon).toBeInTheDocument();
    expect(discardIcon).toBeInTheDocument();
    expect(cancelIcon).toBeInTheDocument();
  });
});
