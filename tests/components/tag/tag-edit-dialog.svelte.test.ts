import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagEditDialog from '$lib/components/tag/tag-edit-dialog.svelte';
import type { Tag } from '$lib/types/task';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

describe('TagEditDialog', () => {
  const mockTag: Tag = {
    id: 'test-tag',
    name: 'テストタグ',
    color: '#ff0000',
    created_at: new Date(),
    updated_at: new Date()
  };

  const defaultProps = {
    open: true,
    tag: mockTag,
    onsave: vi.fn(),
    onclose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createUnitTestTranslationService());
  });

  it('表示される', () => {
    render(TagEditDialog, { props: defaultProps });

    expect(screen.getByText('タグの編集')).toBeInTheDocument();
    expect(screen.getByLabelText('タグ名')).toBeInTheDocument();
    expect(screen.getByLabelText('タグ色')).toBeInTheDocument();
  });

  it('渡されたタグ情報がフォームに表示される', () => {
    render(TagEditDialog, { props: defaultProps });

    const nameInput = screen.getByDisplayValue('テストタグ');
    expect(nameInput).toBeInTheDocument();

    const colorInputs = screen.getAllByDisplayValue('#ff0000');
    expect(colorInputs.length).toBe(2); // カラーピッカーとテキスト入力
  });

  it('プレビューエリアでタグが確認できる', () => {
    render(TagEditDialog, { props: defaultProps });

    const preview = screen.getByText('テストタグ');
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveStyle({ color: '#ff0000' });
  });

  it('タグ名が入力されると保存ボタンが有効になる', async () => {
    const props = { ...defaultProps, tag: null };
    render(TagEditDialog, { props });

    const saveButton = screen.getByText(unitTestTranslations.save);
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByLabelText('タグ名');
    await fireEvent.input(nameInput, { target: { value: '新しいタグ' } });

    expect(saveButton).not.toBeDisabled();
  });

  it('空白のみのタグ名では保存ボタンが無効になる', async () => {
    render(TagEditDialog, { props: defaultProps });

    const nameInput = screen.getByDisplayValue('テストタグ');
    await fireEvent.input(nameInput, { target: { value: '   ' } });

    const saveButton = screen.getByText(unitTestTranslations.save);
    expect(saveButton).toBeDisabled();
  });

  it('保存ボタンクリックで正しいデータが渡される', async () => {
    const mockOnsave = vi.fn();
    const props = { ...defaultProps, onsave: mockOnsave };
    render(TagEditDialog, { props });

    const nameInput = screen.getByDisplayValue('テストタグ');
    await fireEvent.input(nameInput, { target: { value: '編集されたタグ' } });

    const colorInputs = screen.getAllByDisplayValue('#ff0000');
    await fireEvent.input(colorInputs[1], { target: { value: '#00ff00' } });

    const saveButton = screen.getByText(unitTestTranslations.save);
    await fireEvent.click(saveButton);

    expect(mockOnsave).toHaveBeenCalledWith({
      name: '編集されたタグ',
      color: '#00ff00'
    });
  });

  it('タグ名の前後の空白は削除される', async () => {
    const mockOnsave = vi.fn();
    const props = { ...defaultProps, onsave: mockOnsave };
    render(TagEditDialog, { props });

    const nameInput = screen.getByDisplayValue('テストタグ');
    await fireEvent.input(nameInput, { target: { value: '  タグ名  ' } });

    const saveButton = screen.getByText(unitTestTranslations.save);
    await fireEvent.click(saveButton);

    expect(mockOnsave).toHaveBeenCalledWith({
      name: 'タグ名',
      color: '#ff0000'
    });
  });

  it('キャンセルボタンクリックでoncloseが呼ばれる', async () => {
    const mockOnclose = vi.fn();
    const props = { ...defaultProps, onclose: mockOnclose };
    render(TagEditDialog, { props });

    const cancelButton = screen.getByText(unitTestTranslations.cancel);
    await fireEvent.click(cancelButton);

    expect(mockOnclose).toHaveBeenCalled();
  });

  it('Enterキーで保存が実行される', async () => {
    const mockOnsave = vi.fn();
    const props = { ...defaultProps, onsave: mockOnsave };
    render(TagEditDialog, { props });

    const nameInput = screen.getByDisplayValue('テストタグ');
    await fireEvent.keyDown(nameInput, { key: 'Enter' });

    expect(mockOnsave).toHaveBeenCalledWith({
      name: 'テストタグ',
      color: '#ff0000'
    });
  });

  it('Escapeキーでダイアログが閉じられる', async () => {
    const mockOnclose = vi.fn();
    const props = { ...defaultProps, onclose: mockOnclose };
    render(TagEditDialog, { props });

    const nameInput = screen.getByDisplayValue('テストタグ');
    await fireEvent.keyDown(nameInput, { key: 'Escape' });

    expect(mockOnclose).toHaveBeenCalled();
  });

  it('新規タグ作成時にデフォルト色が設定される', () => {
    const props = { ...defaultProps, tag: null };
    render(TagEditDialog, { props });

    const colorInputs = screen.getAllByDisplayValue('#6b7280');
    expect(colorInputs.length).toBeGreaterThan(0);
  });

  it('カラーピッカーで色を変更できる', async () => {
    render(TagEditDialog, { props: defaultProps });

    const colorPicker = screen.getByLabelText('タグ色');
    await fireEvent.input(colorPicker, { target: { value: '#0000ff' } });

    // カラーピッカーの値が反映されることを確認
    expect(colorPicker).toHaveValue('#0000ff');
  });

  it('色がundefinedの場合はデフォルト色が使用される', () => {
    const tagWithoutColor = { ...mockTag, color: undefined };
    const props = { ...defaultProps, tag: tagWithoutColor };
    render(TagEditDialog, { props });

    const colorInputs = screen.getAllByDisplayValue('#6b7280');
    expect(colorInputs.length).toBeGreaterThan(0);
  });

  it('プレビューで名前が空の場合はプレースホルダーが表示される', async () => {
    render(TagEditDialog, { props: defaultProps });

    const nameInput = screen.getByDisplayValue('テストタグ');
    await fireEvent.input(nameInput, { target: { value: '' } });

    // プレビューエリア内の「タグ名」を探す
    const previews = screen.getAllByText('タグ名');
    expect(previews.length).toBeGreaterThan(0);
  });

  it('openがfalseの場合はダイアログが表示されない', () => {
    const props = { ...defaultProps, open: false };
    render(TagEditDialog, { props });

    expect(screen.queryByText('タグの編集')).not.toBeInTheDocument();
  });
});
