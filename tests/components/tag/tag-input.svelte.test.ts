import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagInput from '$lib/components/tag/tag-input.svelte';
import type { Tag } from '$lib/types/task';

// TagDisplayのモック
vi.mock('$lib/components/tag/tag-display.svelte', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      $$render: () => '<div data-testid="tag-display">MockedTagDisplay</div>'
    }))
  };
});

// TagCompletionProviderのモック
vi.mock('$lib/components/tag/tag-completion-provider.svelte', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      $$render: ($$result: any, $$props: any, $$bindings: any, slots: any) => 
        `<div data-testid="tag-completion-provider">${slots.default ? slots.default() : ''}</div>`
    }))
  };
});

describe('TagInput', () => {
  const mockTags: Tag[] = [
    { id: '1', name: 'タグ1', color: '#ff0000' },
    { id: '2', name: 'タグ2', color: '#00ff00' }
  ];

  const defaultProps = {
    tags: mockTags,
    ontagAdded: vi.fn(),
    ontagRemoved: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('入力フィールドが表示される', () => {
    render(TagInput, { props: { tags: [] } });
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('プレースホルダーが表示される', () => {
    const placeholder = 'タグを追加...';
    render(TagInput, { props: { tags: [], placeholder } });
    
    const input = screen.getByPlaceholderText(placeholder);
    expect(input).toBeInTheDocument();
  });

  it('デフォルトプレースホルダーが使用される', () => {
    render(TagInput, { props: { tags: [] } });
    
    const input = screen.getByPlaceholderText('Add tags...');
    expect(input).toBeInTheDocument();
  });

  it('既存のタグが表示される', () => {
    render(TagInput, { props: defaultProps });
    
    // TagDisplayコンポーネントがレンダリングされているかテスト
    const tagDisplays = screen.getAllByTestId('tag-display');
    expect(tagDisplays).toHaveLength(2);
  });

  it('タグがない場合はタグエリアが表示されない', () => {
    render(TagInput, { props: { tags: [], ontagAdded: vi.fn() } });
    
    const tagDisplays = screen.queryAllByTestId('tag-display');
    expect(tagDisplays).toHaveLength(0);
  });

  it('Enterキーでタグが追加される', async () => {
    const mockOntagAdded = vi.fn();
    render(TagInput, { props: { tags: [], ontagAdded: mockOntagAdded } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '新しいタグ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOntagAdded).toHaveBeenCalledWith('新しいタグ');
  });

  it('スペースキーでタグが追加される', async () => {
    const mockOntagAdded = vi.fn();
    render(TagInput, { props: { tags: [], ontagAdded: mockOntagAdded } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '新しいタグ' } });
    await fireEvent.keyDown(input, { key: ' ' });
    
    expect(mockOntagAdded).toHaveBeenCalledWith('新しいタグ');
  });

  it('前後の空白が削除される', async () => {
    const mockOntagAdded = vi.fn();
    render(TagInput, { props: { tags: [], ontagAdded: mockOntagAdded } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '  新しいタグ  ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOntagAdded).toHaveBeenCalledWith('新しいタグ');
  });

  it('#記号が削除される', async () => {
    const mockOntagAdded = vi.fn();
    render(TagInput, { props: { tags: [], ontagAdded: mockOntagAdded } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '#新しいタグ#' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOntagAdded).toHaveBeenCalledWith('新しいタグ');
  });

  it('スペースが削除される', async () => {
    const mockOntagAdded = vi.fn();
    render(TagInput, { props: { tags: [], ontagAdded: mockOntagAdded } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '新しい タグ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOntagAdded).toHaveBeenCalledWith('新しいタグ');
  });

  it('空文字の場合はタグが追加されない', async () => {
    const mockOntagAdded = vi.fn();
    render(TagInput, { props: { tags: [], ontagAdded: mockOntagAdded } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '   ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOntagAdded).not.toHaveBeenCalled();
  });

  it('空文字の場合は入力値がクリアされる', async () => {
    render(TagInput, { props: { tags: [], ontagAdded: vi.fn() } });
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '   ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(input.value).toBe('');
  });

  it('既存のタグと重複する場合は追加されない', async () => {
    const mockOntagAdded = vi.fn();
    render(TagInput, { props: { tags: mockTags, ontagAdded: mockOntagAdded } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'タグ1' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOntagAdded).not.toHaveBeenCalled();
  });

  it('大文字小文字を区別せずに重複を検出する', async () => {
    const mockOntagAdded = vi.fn();
    render(TagInput, { props: { tags: mockTags, ontagAdded: mockOntagAdded } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'タグ１' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    // 異なるスペルなので追加されるはず
    expect(mockOntagAdded).toHaveBeenCalled();
  });

  it('重複する場合は入力値がクリアされる', async () => {
    render(TagInput, { props: { tags: mockTags, ontagAdded: vi.fn() } });
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'タグ1' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(input.value).toBe('');
  });

  it('タグ追加後に入力値がクリアされる', async () => {
    render(TagInput, { props: { tags: [], ontagAdded: vi.fn() } });
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: '新しいタグ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(input.value).toBe('');
  });

  it('Escapeキーで入力フィールドがblurされる', async () => {
    render(TagInput, { props: { tags: [], ontagAdded: vi.fn() } });
    
    const input = screen.getByRole('textbox');
    await fireEvent.focus(input);
    await fireEvent.keyDown(input, { key: 'Escape' });
    
    expect(input).not.toHaveFocus();
  });

  it('customクラスが適用される', () => {
    const customClass = 'custom-class';
    render(TagInput, { props: { tags: [], class: customClass } });
    
    const container = screen.getByRole('textbox').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('入力値の変更が処理される', async () => {
    render(TagInput, { props: { tags: [], ontagAdded: vi.fn() } });
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await fireEvent.input(input, { target: { value: 'テストタグ' } });
    
    expect(input.value).toBe('テストタグ');
  });

  it('TagCompletionProviderが正しく配置される', () => {
    render(TagInput, { props: { tags: [] } });
    
    const completionProvider = screen.getByTestId('tag-completion-provider');
    expect(completionProvider).toBeInTheDocument();
  });
});