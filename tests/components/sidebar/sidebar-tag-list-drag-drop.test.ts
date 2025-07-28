import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import SidebarTagList from '$lib/components/sidebar/sidebar-tag-list.svelte';
import { TaskService } from '$lib/services/task-service';
import { DragDropManager } from '$lib/utils/drag-drop';
import type { Tag } from '$lib/types/task';

// モック
vi.mock('$lib/services/task-service', () => ({
  TaskService: {
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
  const mockTagStore = {
    bookmarkedTagList: [] as any,
    removeBookmark: vi.fn(),
    deleteTag: vi.fn(),
    updateTag: vi.fn(),
    moveBookmarkedTagToPosition: vi.fn()
  };
  return {
    tagStore: mockTagStore
  };
});

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    removeTagFromAllTasks: vi.fn(),
    getTaskCountByTag: vi.fn(() => 0)
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

vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: () => string) => fn
}));

vi.mock('$paraglide/messages.js', () => ({
  tags: () => 'Tags',
  remove_tag_from_sidebar: () => 'Remove from sidebar',
  add_tag_to_sidebar: () => 'Add tag to sidebar',
  edit_tag: () => 'Edit tag',
  delete_tag: () => 'Delete tag',
  cancel: () => 'Cancel',
  save: () => 'Save',
  tag_name: () => 'Tag name',
  tag_color: () => 'Tag color',
  remove: () => 'Remove',
  delete_tag_confirmation: () => 'Are you sure you want to delete this tag?'
}));

describe('SidebarTagList - Drag & Drop', () => {
  const mockTags: Tag[] = [
    {
      id: 'tag-1',
      name: 'Work',
      color: '#blue',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'tag-2',
      name: 'Personal',
      color: '#green',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
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
      (tagStore as any).bookmarkedTagList = mockTags;

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
        expect(TaskService.addTagToTask).toHaveBeenCalledWith('task-1', 'tag-1');
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
      (tagStore as any).bookmarkedTagList = mockTags;

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
        expect((tagStore as any).moveBookmarkedTagToPosition).toHaveBeenCalledWith('tag-2', 0);
        expect(TaskService.addTagToTask).not.toHaveBeenCalled();
      }
    });

    it('無効なドロップの場合は何もしない', async () => {
      // DragDropManager.handleDropがnullを返すようにモック
      vi.mocked(DragDropManager.handleDrop).mockReturnValue(null);

      // タグストアのモックを更新
      const { tagStore } = await import('$lib/stores/tags.svelte');
      (tagStore as any).bookmarkedTagList = mockTags;

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
        expect(TaskService.addTagToTask).not.toHaveBeenCalled();
        expect((tagStore as any).moveBookmarkedTagToPosition).not.toHaveBeenCalled();
      }
    });
  });

  describe('空のタグリスト', () => {
    it('タグがない場合は何も表示されない', async () => {
      // 空のタグリストをモック
      const { tagStore } = await import('$lib/stores/tags.svelte');
      (tagStore as any).bookmarkedTagList = [];

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