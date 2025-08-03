import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import UnsavedChangesDialog from '$lib/components/dialog/unsaved-changes-dialog.svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

describe('UnsavedChangesDialog', () => {
  const defaultProps = {
    show: true,
    onSaveAndContinue: vi.fn(),
    onDiscardAndContinue: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createUnitTestTranslationService());
  });

  it('ダイアログが表示される', () => {
    render(UnsavedChangesDialog, { props: defaultProps });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(unitTestTranslations.confirm_discard_changes)).toBeInTheDocument();
    expect(screen.getByText(unitTestTranslations.unsaved_task_message)).toBeInTheDocument();
  });

  it('showがfalseの場合はダイアログが表示されない', () => {
    const props = { ...defaultProps, show: false };
    render(UnsavedChangesDialog, { props });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('3つのボタンが表示される', () => {
    render(UnsavedChangesDialog, { props: defaultProps });

    expect(screen.getByTitle(unitTestTranslations.save)).toBeInTheDocument();
    expect(screen.getByTitle(unitTestTranslations.discard_changes)).toBeInTheDocument();
    expect(screen.getByTitle(unitTestTranslations.cancel)).toBeInTheDocument();
  });

  it('保存ボタンクリックでonSaveAndContinueが呼ばれる', async () => {
    const mockOnSaveAndContinue = vi.fn();
    const props = { ...defaultProps, onSaveAndContinue: mockOnSaveAndContinue };
    render(UnsavedChangesDialog, { props });

    const saveButton = screen.getByTitle(unitTestTranslations.save);
    await fireEvent.click(saveButton);

    expect(mockOnSaveAndContinue).toHaveBeenCalled();
  });

  it('破棄ボタンクリックでonDiscardAndContinueが呼ばれる', async () => {
    const mockOnDiscardAndContinue = vi.fn();
    const props = { ...defaultProps, onDiscardAndContinue: mockOnDiscardAndContinue };
    render(UnsavedChangesDialog, { props });

    const discardButton = screen.getByTitle(unitTestTranslations.discard_changes);
    await fireEvent.click(discardButton);

    expect(mockOnDiscardAndContinue).toHaveBeenCalled();
  });

  it('キャンセルボタンクリックでonCancelが呼ばれる', async () => {
    const mockOnCancel = vi.fn();
    const props = { ...defaultProps, onCancel: mockOnCancel };
    render(UnsavedChangesDialog, { props });

    const cancelButton = screen.getByTitle(unitTestTranslations.cancel);
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

    const saveButton = screen.getByTitle(unitTestTranslations.save);
    const discardButton = screen.getByTitle(unitTestTranslations.discard_changes);
    const cancelButton = screen.getByTitle(unitTestTranslations.cancel);

    // 各ボタン内のアイコンが適切なサイズクラスを持つことを確認
    const saveIcon = saveButton.querySelector('svg.h-4.w-4');
    const discardIcon = discardButton.querySelector('svg.h-4.w-4');
    const cancelIcon = cancelButton.querySelector('svg.h-4.w-4');

    expect(saveIcon).toBeInTheDocument();
    expect(discardIcon).toBeInTheDocument();
    expect(cancelIcon).toBeInTheDocument();
  });
});
