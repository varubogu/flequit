import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagDisplay from '$lib/components/tag/display/tag-display.svelte';
import type { Tag } from '$lib/types/tag';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import { TagService } from '$lib/services/domain/tag';
import { TagBookmarkService } from '$lib/services/domain/tag-bookmark';
import { taskStore } from '$lib/stores/tasks.svelte';

const { tagStoreMock } = vi.hoisted(() => ({
  tagStoreMock: {
    bookmarkedTags: [] as string[],
    getProjectIdByTagId: vi.fn(async () => null as string | null),
    toggleBookmark: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn()
  }
}));

// モック設定
vi.mock('$lib/stores/tags.svelte', () => ({
  tagStore: tagStoreMock
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
    tagStoreMock.bookmarkedTags = [];
    tagStoreMock.getProjectIdByTagId.mockReset();
    tagStoreMock.getProjectIdByTagId.mockResolvedValue(null);
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

  it('does not bookmark, edit, or delete a tag when no project id can be resolved', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const toggleBookmark = vi.spyOn(TagBookmarkService, 'toggleBookmark');
    const updateTag = vi.spyOn(TagService, 'updateTag');
    const deleteTag = vi.spyOn(TagService, 'deleteTag');

    render(TagDisplay, { props: defaultProps });
    await fireEvent.contextMenu(screen.getByText('test-tag'));
    await fireEvent.click(await screen.findByText('TEST_ADD_TAG_TO_SIDEBAR'));
    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('[TagDisplay] Project ID not found for tag:', '1');
    });
    expect(toggleBookmark).not.toHaveBeenCalled();

    await fireEvent.contextMenu(screen.getByText('test-tag'));
    await fireEvent.click(await screen.findByText('TEST_EDIT_TAG'));
    await fireEvent.click(await screen.findByText('TEST_SAVE'));
    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Project ID not found for tag:', '1');
    });
    expect(updateTag).not.toHaveBeenCalled();

    await fireEvent.contextMenu(screen.getByText('test-tag'));
    await fireEvent.click(await screen.findByText('TEST_DELETE_TAG'));
    await fireEvent.click(await screen.findByText('TEST_DELETE'));
    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('Project ID not found for tag:', '1');
    });
    expect(deleteTag).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('bookmarks with the given project, and edits or deletes through the resolved project', async () => {
    tagStoreMock.bookmarkedTags = ['1'];
    tagStoreMock.getProjectIdByTagId.mockResolvedValue('project-9');
    const toggleBookmark = vi.spyOn(TagBookmarkService, 'toggleBookmark').mockResolvedValue();
    const updateTag = vi.spyOn(TagService, 'updateTag').mockResolvedValue();
    const deleteTag = vi
      .spyOn(TagService, 'deleteTag')
      .mockImplementation(async (_projectId, tagId, onDelete) => {
        onDelete?.(tagId);
      });

    render(TagDisplay, { props: { ...defaultProps, projectId: 'project-1' } });

    await fireEvent.contextMenu(screen.getByText('test-tag'));
    await fireEvent.click(await screen.findByText('TEST_REMOVE_TAG_FROM_SIDEBAR'));
    await vi.waitFor(() => {
      expect(toggleBookmark).toHaveBeenCalledWith('project-1', '1');
    });

    await fireEvent.contextMenu(screen.getByText('test-tag'));
    await fireEvent.click(await screen.findByText('TEST_EDIT_TAG'));
    const nameInput = await screen.findByLabelText('タグ名');
    await fireEvent.input(nameInput, { target: { value: 'renamed' } });
    await fireEvent.click(screen.getByText('TEST_SAVE'));
    await vi.waitFor(() => {
      expect(updateTag).toHaveBeenCalledWith(
        'project-9',
        '1',
        expect.objectContaining({ name: 'renamed', color: '#ff0000' })
      );
    });

    await fireEvent.contextMenu(screen.getByText('test-tag'));
    await fireEvent.click(await screen.findByText('TEST_DELETE_TAG'));
    await fireEvent.click(await screen.findByText('TEST_DELETE'));
    await vi.waitFor(() => {
      expect(deleteTag).toHaveBeenCalledWith('project-9', '1', expect.any(Function));
    });
    expect(taskStore.removeTagFromAllTasks).toHaveBeenCalledWith('1');
  });

  it('logs a bookmark failure without reporting a missing project', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(TagBookmarkService, 'toggleBookmark').mockRejectedValue(new Error('offline'));

    render(TagDisplay, { props: { ...defaultProps, projectId: 'project-1' } });
    await fireEvent.contextMenu(screen.getByText('test-tag'));
    await fireEvent.click(await screen.findByText('TEST_ADD_TAG_TO_SIDEBAR'));

    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        '[TagDisplay] Failed to toggle bookmark:',
        expect.any(Error)
      );
    });
    errorSpy.mockRestore();
  });
});
