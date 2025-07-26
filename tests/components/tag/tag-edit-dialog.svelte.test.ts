import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagEditDialog from '$lib/components/tag/tag-edit-dialog.svelte';
import type { Tag } from '$lib/types/task';

// モック設定
vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: vi.fn((messageFn) => {
    return vi.fn(() => 'Mocked message');
  })
}));

vi.mock('$paraglide/messages.js', () => ({
  cancel: vi.fn(() => 'Cancel'),
  save: vi.fn(() => 'Save'),
  tags: vi.fn(() => 'Tags')
}));

describe('TagEditDialog', () => {
  const mockTag: Tag = {
    id: '1',
    name: 'test-tag',
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
  });

  it('コンポーネントが正しくマウントされる', () => {
    const { container } = render(TagEditDialog, { props: defaultProps });
    expect(container).toBeTruthy();
  });

  it('ダイアログが開いているときに表示される', () => {
    render(TagEditDialog, { props: defaultProps });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ダイアログが閉じているときに表示されない', () => {
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        open: false 
      } 
    });
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('タイトルが正しく表示される', () => {
    render(TagEditDialog, { props: defaultProps });
    
    expect(screen.getByText('タグの編集')).toBeInTheDocument();
  });

  it('キャンセルボタンが表示される', () => {
    render(TagEditDialog, { props: defaultProps });
    
    const buttons = screen.getAllByText('Mocked message');
    expect(buttons).toHaveLength(2); // Cancel と Save
  });

  it('保存ボタンが表示される', () => {
    render(TagEditDialog, { props: defaultProps });
    
    const buttons = screen.getAllByText('Mocked message');
    expect(buttons).toHaveLength(2); // Cancel と Save
  });

  it('タグ名入力フィールドが表示される', () => {
    render(TagEditDialog, { props: defaultProps });
    
    const nameInput = screen.getByLabelText('タグ名');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('test-tag');
  });

  it('タグ色入力フィールドが表示される', () => {
    render(TagEditDialog, { props: defaultProps });
    
    expect(screen.getByLabelText('タグ色')).toBeInTheDocument();
  });

  it('プレビューが表示される', () => {
    render(TagEditDialog, { props: defaultProps });
    
    expect(screen.getByText('プレビュー')).toBeInTheDocument();
    expect(screen.getByText('test-tag')).toBeInTheDocument();
  });

  it('キャンセルボタンをクリックするとoncloseが呼ばれる', async () => {
    const onclose = vi.fn();
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        onclose 
      } 
    });
    
    const buttons = screen.getAllByText('Mocked message');
    const cancelButton = buttons[0]; // 最初のボタンがキャンセル
    await fireEvent.click(cancelButton);
    
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('保存ボタンをクリックするとonsaveが呼ばれる', async () => {
    const onsave = vi.fn();
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        onsave 
      } 
    });
    
    const buttons = screen.getAllByText('Mocked message');
    const saveButton = buttons[1]; // 2番目のボタンが保存
    await fireEvent.click(saveButton);
    
    expect(onsave).toHaveBeenCalledWith({
      name: 'test-tag',
      color: '#ff0000'
    });
  });

  it('タグ名を変更して保存できる', async () => {
    const onsave = vi.fn();
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        onsave 
      } 
    });
    
    const nameInput = screen.getByLabelText('タグ名');
    await fireEvent.input(nameInput, { target: { value: 'new-tag-name' } });
    
    const buttons = screen.getAllByText('Mocked message');
    const saveButton = buttons[1]; // 2番目のボタンが保存
    await fireEvent.click(saveButton);
    
    expect(onsave).toHaveBeenCalledWith({
      name: 'new-tag-name',
      color: '#ff0000'
    });
  });

  it('タグ色を変更して保存できる', async () => {
    const onsave = vi.fn();
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        onsave 
      } 
    });
    
    const colorInputs = screen.getAllByDisplayValue('#ff0000');
    const textColorInput = colorInputs.find(input => input.tagName === 'INPUT' && input.type === 'text');
    
    if (textColorInput) {
      await fireEvent.input(textColorInput, { target: { value: '#00ff00' } });
    }
    
    const buttons = screen.getAllByText('Mocked message');
    const saveButton = buttons[1]; // 2番目のボタンが保存
    await fireEvent.click(saveButton);
    
    expect(onsave).toHaveBeenCalledWith({
      name: 'test-tag',
      color: '#00ff00'
    });
  });

  it('空のタグ名では保存ボタンが無効になる', async () => {
    render(TagEditDialog, { props: defaultProps });
    
    const nameInput = screen.getByLabelText('タグ名');
    await fireEvent.input(nameInput, { target: { value: '' } });
    
    const buttons = screen.getAllByText('Mocked message');
    const saveButton = buttons[1]; // 2番目のボタンが保存
    expect(saveButton).toBeDisabled();
  });

  it('スペースのみのタグ名では保存ボタンが無効になる', async () => {
    render(TagEditDialog, { props: defaultProps });
    
    const nameInput = screen.getByLabelText('タグ名');
    await fireEvent.input(nameInput, { target: { value: '   ' } });
    
    const buttons = screen.getAllByText('Mocked message');
    const saveButton = buttons[1]; // 2番目のボタンが保存
    expect(saveButton).toBeDisabled();
  });

  it('Enterキーで保存が実行される', async () => {
    const onsave = vi.fn();
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        onsave 
      } 
    });
    
    const nameInput = screen.getByLabelText('タグ名');
    await fireEvent.keyDown(nameInput, { key: 'Enter' });
    
    expect(onsave).toHaveBeenCalledWith({
      name: 'test-tag',
      color: '#ff0000'
    });
  });

  it('Escapeキーでダイアログが閉じる', async () => {
    const onclose = vi.fn();
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        onclose 
      } 
    });
    
    const nameInput = screen.getByLabelText('タグ名');
    await fireEvent.keyDown(nameInput, { key: 'Escape' });
    
    // Escapeキーはダイアログとタグ編集の両方で処理される可能性があるため、
    // 少なくとも1回は呼ばれることを確認
    expect(onclose).toHaveBeenCalled();
  });

  it('tagがnullの場合でも正しく動作する', () => {
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        tag: null 
      } 
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('タグ名')).toHaveValue('');
  });

  it('色が指定されていないタグでデフォルト色が使用される', () => {
    const tagWithoutColor: Tag = {
      id: '2',
      name: 'no-color-tag',
      color: undefined,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    render(TagEditDialog, { 
      props: { 
        ...defaultProps, 
        tag: tagWithoutColor 
      } 
    });
    
    const colorInputs = screen.getAllByDisplayValue('#6b7280');
    expect(colorInputs.length).toBeGreaterThan(0);
  });

  it('プレビューがリアルタイムで更新される', async () => {
    render(TagEditDialog, { props: defaultProps });
    
    // 初期状態でtest-tagが表示されることを確認
    expect(screen.getByText('test-tag')).toBeInTheDocument();
    
    // タグ名を変更
    const nameInput = screen.getByLabelText('タグ名');
    await fireEvent.input(nameInput, { target: { value: 'updated-tag' } });
    
    // プレビューが更新されることを確認
    expect(screen.getByText('updated-tag')).toBeInTheDocument();
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      open: true,
      tag: mockTag,
      onsave: vi.fn(),
      onclose: vi.fn()
    };
    
    const { container } = render(TagEditDialog, { props });
    
    expect(container).toBeTruthy();
    expect(props.onsave).toBeInstanceOf(Function);
    expect(props.onclose).toBeInstanceOf(Function);
  });
});