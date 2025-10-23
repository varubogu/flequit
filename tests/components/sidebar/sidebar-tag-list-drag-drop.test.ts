/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import SidebarTagList from '$lib/components/sidebar/sidebar-tag-list.svelte';
import { taskMutations } from '$lib/services/domain/task/task-mutations-instance';
import { DragDropManager } from '$lib/utils/drag-drop';
import type { Tag } from '$lib/types/tag';

// モック
vi.mock('$lib/services/domain/task/task-mutations-instance', () => ({
  taskMutations: {
    addTagToTask: vi.fn()
  }
}));

vi.mock('$lib/utils/drag-drop', () => ({
  DragDropManager: {
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragLeave: vi.fn(),
    startDrag: vi.fn()
  }
}));

vi.mock('$lib/stores/tags.svelte', () => {
  const state = {
    bookmarkedTagList: [] as Tag[],
    tags: [] as Tag[]
  };

  const mockTagStore = {
    get bookmarkedTagList() {
      return state.bookmarkedTagList;
    },
    set bookmarkedTagList(value: Tag[]) {
      state.bookmarkedTagList = value;
    },
    get tags() {
      return state.tags;
    },
    set tags(value: Tag[]) {
      state.tags = value;
    },
    removeBookmark: vi.fn(),
    deleteTag: vi.fn(),
    updateTag: vi.fn(),
    moveBookmarkedTagToPosition: vi.fn(),
    addTagWithId: vi.fn((tag: Tag) => {
      state.tags.push(tag);
      return tag;
    }),
    isBookmarked: vi.fn(() => true),
    getProjectIdByTagId: vi.fn(async () => 'project-1')
  };

  return {
    tagStore: mockTagStore
  };
});

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    removeTagFromAllTasks: vi.fn(),
    getTaskCountByTag: vi.fn(() => 0),
    getTaskProjectAndList: vi.fn(() => ({
      project: { id: 'project-1' },
      list: { id: 'list-1' }
    })),
    attachTagToTask: vi.fn(),
    detachTagFromTask: vi.fn()
  }
}));

vi.mock('$lib/stores/view-store.svelte', () => ({
  viewStore: {
    performSearch: vi.fn()
  }
}));

vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    state: 'expanded'
  })
}));

describe('SidebarTagList - Drag & Drop', () => {
  const mockTags: Tag[] = [
    {
      id: 'tag-1',
      name: 'Work',
      color: '#blue',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'tag-2',
      name: 'Personal',
      color: '#green',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    vi.clearAllMocks();
    vi.mocked(taskMutations.addTagToTask).mockClear();
  });

  describe('タスクをタグにドロップ', () => {
    it('タスクがタグにドロップされた場合にTaskService.addTagToTaskが呼ばれる', async () => {
      // DragDropManager.handleDropがタスクのドラッグデータを返すようにモック
      vi.mocked(DragDropManager.handleDrop).mockReturnValue({
        type: 'task',
        id: 'task-1'
      });

      // タグストアのモックを更新
      const { tagStore } = await import('$lib/stores/tags.svelte');
      (tagStore as unknown as Record<string, unknown>).bookmarkedTagList = mockTags;
      (tagStore as unknown as Record<string, unknown>).tags = mockTags;

      const { container } = render(SidebarTagList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      // タグ要素を取得（具体的なセレクターは実装に依存）
      const tagElements = container.querySelectorAll('[data-testid^="tag-"]');
      expect(tagElements.length).toBeGreaterThan(0);

      // 最初のタグ要素にドロップイベントを発生
      if (tagElements[0]) {
        const dropEvent = new Event('drop') as DragEvent;
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: { dropEffect: '' }
        });

    await fireEvent(tagElements[0], dropEvent);

    expect(DragDropManager.handleDrop).toHaveBeenCalled();
    expect(taskMutations.addTagToTask).toHaveBeenCalledWith('task-1', 'tag-1');
      }
    });

    it('タグがタグにドロップされた場合は並び替え処理が実行される', async () => {
      // DragDropManager.handleDropがタグのドラッグデータを返すようにモック
      vi.mocked(DragDropManager.handleDrop).mockReturnValue({
        type: 'tag',
        id: 'tag-2'
      });

      // タグストアのモックを更新
      const { tagStore } = await import('$lib/stores/tags.svelte');
      (tagStore as unknown as Record<string, unknown>).bookmarkedTagList = mockTags;
      (tagStore as unknown as Record<string, unknown>).tags = mockTags;

      const { container } = render(SidebarTagList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      const tagElements = container.querySelectorAll('[data-testid^="tag-"]');

      if (tagElements[0]) {
        const dropEvent = new Event('drop') as DragEvent;
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: { dropEffect: '' }
        });

        await fireEvent(tagElements[0], dropEvent);

        expect(DragDropManager.handleDrop).toHaveBeenCalled();
        expect(
          (tagStore as unknown as Record<string, unknown>).moveBookmarkedTagToPosition
        ).toHaveBeenCalledWith('tag-2', 0);
        expect(taskMutations.addTagToTask).not.toHaveBeenCalled();
      }
    });

    it('無効なドロップの場合は何もしない', async () => {
      // DragDropManager.handleDropがnullを返すようにモック
      vi.mocked(DragDropManager.handleDrop).mockReturnValue(null);

      // タグストアのモックを更新
      const { tagStore } = await import('$lib/stores/tags.svelte');
      (tagStore as unknown as Record<string, unknown>).bookmarkedTagList = mockTags;
      (tagStore as unknown as Record<string, unknown>).tags = mockTags;

      const { container } = render(SidebarTagList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      const tagElements = container.querySelectorAll('[data-testid^="tag-"]');

      if (tagElements[0]) {
        const dropEvent = new Event('drop') as DragEvent;
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: { dropEffect: '' }
        });

        await fireEvent(tagElements[0], dropEvent);

        expect(DragDropManager.handleDrop).toHaveBeenCalled();
        expect(taskMutations.addTagToTask).not.toHaveBeenCalled();
        expect(
          (tagStore as unknown as Record<string, unknown>).moveBookmarkedTagToPosition
        ).not.toHaveBeenCalled();
      }
    });
  });

  describe('空のタグリスト', () => {
    it('タグがない場合は何も表示されない', async () => {
      // 空のタグリストをモック
      const { tagStore } = await import('$lib/stores/tags.svelte');
      (tagStore as unknown as Record<string, unknown>).bookmarkedTagList = [];
      (tagStore as unknown as Record<string, unknown>).tags = [];

      const { container } = render(SidebarTagList, {
        props: {
          currentView: 'all',
          onViewChange: vi.fn()
        }
      });

      // タグセクションが表示されないことを確認
      const tagsSection = container.querySelector('h3');
      expect(tagsSection).toBeNull();
    });
  });
});
