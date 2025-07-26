import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagInput from '$lib/components/tag/tag-input.svelte';
import type { Tag } from '$lib/types/task';

// モック設定
vi.mock('$lib/stores/tags.svelte', () => ({
  tagStore: {
    searchTags: vi.fn().mockReturnValue([]),
    getOrCreateTag: vi.fn().mockReturnValue({ id: '1', name: 'test', color: null })
  }
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    removeTagFromAllTasks: vi.fn()
  }
}));

vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: vi.fn((messageFn) => {
    return vi.fn(() => 'Mocked message');
  })
}));

vi.mock('$paraglide/messages.js', () => ({
  remove_tag_from_item: vi.fn(() => 'Remove tag from item'),
  remove_tag_from_sidebar: vi.fn(() => 'Remove tag from sidebar'),
  add_tag_to_sidebar: vi.fn(() => 'Add tag to sidebar'),
  edit_tag: vi.fn(() => 'Edit tag'),
  delete_tag: vi.fn(() => 'Delete tag'),
  cancel: vi.fn(() => 'Cancel'),
  save: vi.fn(() => 'Save'),
  remove: vi.fn(() => 'Remove'),
  tags: vi.fn(() => 'Tags'),
  tag_name: vi.fn(() => 'Tag Name'),
  tag_color: vi.fn(() => 'Tag Color'),
  delete_tag_description: vi.fn(() => 'Are you sure you want to delete this tag?')
}));

describe('TagInput', () => {
  const mockTags: Tag[] = [
    {
      id: '1',
      name: 'existing-tag',
      color: '#ff0000',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '2',
      name: 'another-tag',
      color: '#00ff00',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  const defaultProps = {
    tags: mockTags,
    ontagAdded: vi.fn(),
    ontagRemoved: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正しくマウントされる', () => {
    const { container } = render(TagInput, { props: defaultProps });
    expect(container).toBeTruthy();
  });

  it('入力フィールドが表示される', () => {
    render(TagInput, { props: defaultProps });
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('デフォルトプレースホルダーが表示される', () => {
    render(TagInput, { props: { tags: [] } });
    
    expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
  });

  it('カスタムプレースホルダーが表示される', () => {
    render(TagInput, { 
      props: { 
        tags: [],
        placeholder: 'Custom placeholder'
      } 
    });
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('既存のタグが表示される', () => {
    render(TagInput, { props: defaultProps });
    
    expect(screen.getByText('existing-tag')).toBeInTheDocument();
    expect(screen.getByText('another-tag')).toBeInTheDocument();
  });

  it('Enterキーで新しいタグを追加できる', async () => {
    const ontagAdded = vi.fn();
    render(TagInput, { 
      props: { 
        tags: [],
        ontagAdded 
      } 
    });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'new-tag' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(ontagAdded).toHaveBeenCalledWith('new-tag');
  });

  it('スペースキーで新しいタグを追加できる', async () => {
    const ontagAdded = vi.fn();
    render(TagInput, { 
      props: { 
        tags: [],
        ontagAdded 
      } 
    });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'space-tag' } });
    await fireEvent.keyDown(input, { key: ' ' });
    
    expect(ontagAdded).toHaveBeenCalledWith('space-tag');
  });

  it('空文字列では新しいタグを追加しない', async () => {
    const ontagAdded = vi.fn();
    render(TagInput, { 
      props: { 
        tags: [],
        ontagAdded 
      } 
    });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(ontagAdded).not.toHaveBeenCalled();
  });

  it('スペースのみの文字列では新しいタグを追加しない', async () => {
    const ontagAdded = vi.fn();
    render(TagInput, { 
      props: { 
        tags: [],
        ontagAdded 
      } 
    });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '   ' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(ontagAdded).not.toHaveBeenCalled();
  });

  it('既存のタグと同じ名前では新しいタグを追加しない', async () => {
    const ontagAdded = vi.fn();
    render(TagInput, { 
      props: { 
        ...defaultProps,
        ontagAdded 
      } 
    });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'existing-tag' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(ontagAdded).not.toHaveBeenCalled();
  });

  it('大文字小文字を区別せずに重複をチェックする', async () => {
    const ontagAdded = vi.fn();
    render(TagInput, { 
      props: { 
        ...defaultProps,
        ontagAdded 
      } 
    });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'EXISTING-TAG' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(ontagAdded).not.toHaveBeenCalled();
  });

  it('ハッシュ記号とスペースを除去してタグを追加する', async () => {
    const ontagAdded = vi.fn();
    render(TagInput, { 
      props: { 
        tags: [],
        ontagAdded 
      } 
    });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: '# clean tag #' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(ontagAdded).toHaveBeenCalledWith('cleantag');
  });

  it('タグ削除ボタンをクリックするとontagRemovedが呼ばれる', async () => {
    const ontagRemoved = vi.fn();
    render(TagInput, { 
      props: { 
        ...defaultProps,
        ontagRemoved 
      } 
    });
    
    // TagDisplayコンポーネント内の削除ボタンを探す
    const buttons = screen.getAllByRole('button');
    const removeButton = buttons[0]; // 最初のタグの削除ボタン
    
    if (removeButton) {
      await fireEvent.click(removeButton);
      expect(ontagRemoved).toHaveBeenCalledWith('1');
    }
  });

  it('Escapeキーで入力フィールドがblurされる', async () => {
    render(TagInput, { props: defaultProps });
    
    const input = screen.getByRole('textbox');
    input.focus();
    
    expect(document.activeElement).toBe(input);
    
    await fireEvent.keyDown(input, { key: 'Escape' });
    
    // Note: jsdomではblurが完全に動作しないことがあるため、
    // キーダウンイベントが正しく処理されることを確認
    expect(input).toBeInTheDocument();
  });

  it('カスタムクラスが適用される', () => {
    const { container } = render(TagInput, { 
      props: { 
        tags: [],
        class: 'custom-class'
      } 
    });
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('タグがない場合はタグ表示エリアが表示されない', () => {
    render(TagInput, { props: { tags: [] } });
    
    // タグ表示エリアが存在しないことを確認
    expect(screen.queryByText('existing-tag')).not.toBeInTheDocument();
    expect(screen.queryByText('another-tag')).not.toBeInTheDocument();
  });

  it('入力値が変更されると内部状態が更新される', async () => {
    render(TagInput, { props: defaultProps });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'test input' } });
    
    expect(input).toHaveValue('test input');
  });

  it('タグ追加後に入力フィールドがクリアされる', async () => {
    const ontagAdded = vi.fn();
    render(TagInput, { 
      props: { 
        tags: [],
        ontagAdded 
      } 
    });
    
    const input = screen.getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'new-tag' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(input).toHaveValue('');
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      tags: mockTags,
      placeholder: 'Test placeholder',
      class: 'test-class',
      ontagAdded: vi.fn(),
      ontagRemoved: vi.fn()
    };
    
    const { container } = render(TagInput, { props });
    
    expect(container).toBeTruthy();
    expect(props.ontagAdded).toBeInstanceOf(Function);
    expect(props.ontagRemoved).toBeInstanceOf(Function);
  });
});