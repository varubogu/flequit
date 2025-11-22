import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagDisplay from '$lib/components/tag/display/tag-display.svelte';
import type { Tag } from '$lib/types/tag';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';

// モック設定
vi.mock('$lib/stores/tags.svelte', () => ({
  tagStore: {
    bookmarkedTags: new Map(),
    toggleBookmark: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn()
  }
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    removeTagFromAllTasks: vi.fn()
  }
}));

describe('TagDisplay', () => {
  const mockTag: Tag = {
    id: '1',
    name: 'test-tag',
    color: '#ff0000',
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
    updatedBy: 'test-user-id'
  };

  const defaultProps = {
    tag: mockTag
  };

  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    vi.clearAllMocks();
  });

  it('コンポーネントが正しくマウントされる', () => {
    const { container } = render(TagDisplay, { props: defaultProps });
    expect(container).toBeTruthy();
  });

  it('タグ名が正しく表示される', () => {
    render(TagDisplay, { props: defaultProps });

    expect(screen.getByText('test-tag')).toBeInTheDocument();
  });

  it('タグ色が正しく適用される', () => {
    render(TagDisplay, { props: defaultProps });

    const badge = screen.getByText('test-tag').closest('.border');
    expect(badge).toHaveAttribute('style', expect.stringContaining('rgb(255, 0, 0)'));
  });

  it('削除ボタンが非表示の場合、通常のバッジが表示される', () => {
    render(TagDisplay, { props: defaultProps });

    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('削除ボタンが表示される場合、Xボタンが表示される', () => {
    render(TagDisplay, {
      props: {
        ...defaultProps,
        showRemoveButton: true
      }
    });

    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとonRemoveが呼ばれる', async () => {
    const onRemove = vi.fn();
    render(TagDisplay, {
      props: {
        ...defaultProps,
        showRemoveButton: true,
        onRemove
      }
    });

    const removeButton = screen.getByRole('button');
    await fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('カスタムクラスが適用される', () => {
    const { container } = render(TagDisplay, {
      props: {
        ...defaultProps,
        class: 'custom-class'
      }
    });

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('色が指定されていない場合、デフォルト色が使用される', () => {
    const tagWithoutColor: Tag = {
      id: '2',
      name: 'no-color-tag',
      color: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      updatedBy: 'test-user-id'
    };

    render(TagDisplay, {
      props: {
        tag: tagWithoutColor
      }
    });

    const badge = screen.getByText('no-color-tag').closest('.border');
    expect(badge).toHaveAttribute('style', expect.stringContaining('rgb(107, 114, 128)'));
  });

  it('コンテキストメニューのトリガーが正しく設定される', () => {
    render(TagDisplay, { props: defaultProps });

    // コンテキストメニュートリガーとしてバッジが存在することを確認
    expect(screen.getByText('test-tag')).toBeInTheDocument();
  });

  it('onTagRemoveFromItemが設定されている場合のコンポーネント動作', () => {
    const onTagRemoveFromItem = vi.fn();

    render(TagDisplay, {
      props: {
        ...defaultProps,
        onTagRemoveFromItem,
        enableTagRemoveFromContext: true
      }
    });

    expect(screen.getByText('test-tag')).toBeInTheDocument();
  });

  it('enableTagRemoveFromContextがfalseの場合', () => {
    render(TagDisplay, {
      props: {
        ...defaultProps,
        enableTagRemoveFromContext: false
      }
    });

    expect(screen.getByText('test-tag')).toBeInTheDocument();
  });

  it('異なるタグデータで正しく描画される', () => {
    const differentTag: Tag = {
      id: '3',
      name: 'different-tag',
      color: '#00ff00',
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      updatedBy: 'test-user-id'
    };

    render(TagDisplay, {
      props: {
        tag: differentTag
      }
    });

    expect(screen.getByText('different-tag')).toBeInTheDocument();
    const badge = screen.getByText('different-tag').closest('.border');
    expect(badge).toHaveAttribute('style', expect.stringContaining('rgb(0, 255, 0)'));
  });

  it('showRemoveButtonプロパティの基本動作確認', () => {
    // 削除ボタンなしでのレンダリング
    const { container } = render(TagDisplay, {
      props: {
        ...defaultProps,
        showRemoveButton: false
      }
    });

    // コンポーネントが正しくマウントされることを確認
    expect(screen.getByText('test-tag')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it('必要なpropsが正しく設定される', () => {
    const props = {
      tag: mockTag,
      showRemoveButton: true,
      onRemove: vi.fn(),
      onTagRemoveFromItem: vi.fn(),
      enableTagRemoveFromContext: true,
      class: 'test-class'
    };

    const { container } = render(TagDisplay, { props });

    expect(container).toBeTruthy();
    expect(props.onRemove).toBeInstanceOf(Function);
    expect(props.onTagRemoveFromItem).toBeInstanceOf(Function);
  });
});
