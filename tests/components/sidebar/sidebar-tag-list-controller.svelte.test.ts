import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSidebarTagListController } from '$lib/components/sidebar/sidebar-tag-list-controller.svelte';
import type { Tag } from '$lib/types/tag';

const { mockUpdateTag, mockDeleteTag } = vi.hoisted(() => {
  return {
    mockUpdateTag: vi.fn(async () => {}),
    mockDeleteTag: vi.fn(
      async (_projectId: string, tagId: string, onDelete?: (tagId: string) => void) => {
        onDelete?.(tagId);
      }
    )
  };
});

// モック
vi.mock('$lib/stores/tags.svelte', () => {
  const mockTags: Tag[] = [
    {
      id: 'tag-1',
      name: 'Work',
      color: '#blue',
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      updatedBy: 'test-user-id'
    }
  ];

  return {
    tagStore: {
      bookmarkedTagList: mockTags,
      removeBookmark: vi.fn(),
      moveBookmarkedTagToPosition: vi.fn(),
      getProjectIdByTagId: vi.fn(async () => 'project-1')
    }
  };
});

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    removeTagFromAllTasks: vi.fn()
  }
}));

vi.mock('$lib/stores/view-store.svelte', () => ({
  viewStore: {
    performSearch: vi.fn()
  }
}));

vi.mock('$lib/utils/drag-drop', () => ({
  DragDropManager: {
    startDrag: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(() => ({ type: 'tag', id: 'tag-2' })),
    handleDragEnd: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragLeave: vi.fn()
  }
}));

vi.mock('$lib/services/domain/task', () => {
  const taskOperations = {
    addTagToTask: vi.fn()
  };

  return {
    taskMutations: taskOperations,
    taskOperations
  };
});

vi.mock('$lib/services/domain/subtask', () => {
  const subTaskOperations = {
    addTagToSubTask: vi.fn()
  };

  return {
    SubTaskOperations: vi.fn(() => subTaskOperations),
    getSubTaskOperations: vi.fn(() => subTaskOperations),
    subTaskOperations
  };
});

vi.mock('$lib/services/domain/tag', () => ({
  TagService: {
    updateTag: mockUpdateTag,
    deleteTag: mockDeleteTag
  }
}));

describe('useSidebarTagListController', () => {
  let controller: ReturnType<typeof useSidebarTagListController>;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = useSidebarTagListController();
  });

  describe('State', () => {
    it('should initialize with correct state', () => {
      expect(controller.bookmarkedTags).toBeDefined();
      expect(controller.selectedTag).toBeNull();
      expect(controller.showEditDialog).toBe(false);
      expect(controller.showDeleteConfirm).toBe(false);
    });

    it('should return bookmarked tags from store', () => {
      const tags = controller.bookmarkedTags;
      expect(tags).toHaveLength(1);
      expect(tags[0].id).toBe('tag-1');
    });
  });

  describe('Tag actions', () => {
    const mockTag: Tag = {
      id: 'tag-1',
      name: 'Work',
      color: '#blue',
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      updatedBy: 'test-user-id'
    };

    it('should handle tag click', async () => {
      const { viewStore } = await import('$lib/stores/view-store.svelte');

      controller.handleTagClick(mockTag);

      expect(viewStore.performSearch).toHaveBeenCalledWith('#Work');
    });

    it('should handle remove from bookmarks', async () => {
      const { tagStore } = await import('$lib/stores/tags.svelte');

      controller.handleRemoveFromBookmarks(mockTag);

      expect(tagStore.removeBookmark).toHaveBeenCalledWith('tag-1');
    });

    it('should handle edit tag', () => {
      controller.handleEditTag(mockTag);

      expect(controller.selectedTag).toStrictEqual(mockTag);
      expect(controller.showEditDialog).toBe(true);
    });

    it('should handle delete tag', () => {
      controller.handleDeleteTag(mockTag);

      expect(controller.selectedTag).toStrictEqual(mockTag);
      expect(controller.showDeleteConfirm).toBe(true);
    });
  });

  describe('Dialog handlers', () => {
    const mockTag: Tag = {
      id: 'tag-1',
      name: 'Work',
      color: '#blue',
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      updatedBy: 'test-user-id'
    };

    it('should handle edit complete', () => {
      controller.handleEditTag(mockTag);
      controller.onEditComplete();

      expect(controller.showEditDialog).toBe(false);
      expect(controller.selectedTag).toBeNull();
    });

    it('should handle edit save', async () => {
      const { TagService } = await import('$lib/services/domain/tag');

      controller.handleEditTag(mockTag);
      await controller.onEditSave({ name: 'Updated', color: '#red' });

      expect(TagService.updateTag).toHaveBeenCalledWith('project-1', 'tag-1', {
        name: 'Updated',
        color: '#red'
      });
      expect(controller.showEditDialog).toBe(false);
    });

    it('should handle delete confirm', async () => {
      const { TagService } = await import('$lib/services/domain/tag');
      const { taskStore } = await import('$lib/stores/tasks.svelte');

      controller.handleDeleteTag(mockTag);
      await controller.onDeleteConfirm();

      expect(TagService.deleteTag).toHaveBeenCalledWith('project-1', 'tag-1', expect.any(Function));
      expect(taskStore.removeTagFromAllTasks).toHaveBeenCalledWith('tag-1');
      expect(controller.showDeleteConfirm).toBe(false);
      expect(controller.selectedTag).toBeNull();
    });

    it('should handle delete cancel', () => {
      controller.handleDeleteTag(mockTag);
      controller.onDeleteCancel();

      expect(controller.showDeleteConfirm).toBe(false);
      expect(controller.selectedTag).toBeNull();
    });
  });

  describe('Drag & Drop handlers', () => {
    const mockTag: Tag = {
      id: 'tag-1',
      name: 'Work',
      color: '#blue',
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      updatedBy: 'test-user-id'
    };

    it('should handle drag start', async () => {
      const { DragDropManager } = await import('$lib/utils/drag-drop');
      const mockEvent = {} as DragEvent;

      controller.handleTagDragStart(mockEvent, mockTag);

      expect(DragDropManager.startDrag).toHaveBeenCalledWith(mockEvent, {
        type: 'tag',
        id: 'tag-1'
      });
    });

    it('should handle drag over', async () => {
      const { DragDropManager } = await import('$lib/utils/drag-drop');
      const mockEvent = {} as DragEvent;

      controller.handleTagDragOver(mockEvent, mockTag);

      expect(DragDropManager.handleDragOver).toHaveBeenCalledWith(mockEvent, {
        type: 'tag',
        id: 'tag-1'
      });
    });

    it('should handle tag drop for tag reordering', async () => {
      const { tagStore } = await import('$lib/stores/tags.svelte');
      const mockEvent = {} as DragEvent;

      controller.handleTagDrop(mockEvent, mockTag);

      expect(tagStore.moveBookmarkedTagToPosition).toHaveBeenCalled();
    });

    it('should handle drag end', async () => {
      const { DragDropManager } = await import('$lib/utils/drag-drop');
      const mockEvent = {} as DragEvent;

      controller.handleTagDragEnd(mockEvent);

      expect(DragDropManager.handleDragEnd).toHaveBeenCalledWith(mockEvent);
    });
  });
});
