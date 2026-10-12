import { describe, expect, it, vi } from 'vitest';
import { useSidebarTagListController } from '$lib/components/sidebar/sidebar-tag-list-controller.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { TagService } from '$lib/services/domain/tag';
import { TaskOperations } from '$lib/services/domain/task';
import { subTaskOperations } from '$lib/services/domain/subtask';
import { DragDropManager, type DragData } from '$lib/utils/drag-drop';
import type { Tag } from '$lib/types/tag';

const tag: Tag = {
  id: 'tag-1',
  name: 'Work',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deleted: false,
  updatedBy: 'tester'
};

function dragEvent(): DragEvent {
  const dataTransfer = {
    effectAllowed: 'move',
    dropEffect: 'move',
    setData: vi.fn(),
    getData: () => ''
  };
  return {
    dataTransfer,
    preventDefault() {},
    target: document.createElement('div'),
    currentTarget: document.createElement('div')
  } as unknown as DragEvent;
}

function drop(data: DragData | null) {
  const controller = useSidebarTagListController();
  const event = dragEvent();
  if (data) {
    DragDropManager.startDrag(event, data);
  }
  controller.handleTagDrop(event, tag);
  DragDropManager.handleDragEnd(event);
  return controller;
}

describe('sidebar tag list controller branches', () => {
  it('refuses to edit or delete a tag that has no project', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(tagStore, 'getProjectIdByTagId').mockResolvedValue(null);
    const updateTag = vi.mocked(TagService.updateTag);
    const deleteTag = vi.mocked(TagService.deleteTag);
    const controller = useSidebarTagListController();
    controller.handleEditTag(tag);

    await controller.onEditSave({ name: 'Renamed', color: '#fff' });
    expect(error).toHaveBeenCalledWith('Project ID not found for tag:', 'tag-1');
    expect(updateTag).not.toHaveBeenCalled();
    expect(controller.showEditDialog).toBe(true);
    expect(controller.selectedTag?.id).toBe('tag-1');

    controller.handleDeleteTag(tag);
    await controller.onDeleteConfirm();
    expect(deleteTag).not.toHaveBeenCalled();
    expect(controller.showDeleteConfirm).toBe(true);
  });

  it('reorders a tag, attaches a task or subtask, and ignores a drop that cannot land', () => {
    const move = vi.spyOn(tagStore, 'moveBookmarkedTagToPosition').mockResolvedValue(undefined);
    const addToTask = vi.spyOn(TaskOperations.prototype, 'addTagToTask').mockResolvedValue(undefined);
    const addToSubTask = vi.mocked(subTaskOperations.addTagToSubTask);

    drop({ type: 'tag', id: 'tag-2' });
    expect(move).toHaveBeenCalledWith('tag-2', expect.any(Number));

    drop({ type: 'task', id: 'task-1' });
    expect(addToTask).toHaveBeenCalledWith('task-1', 'tag-1');

    drop({ type: 'subtask', id: 'sub-1', taskId: 'task-1' });
    expect(addToSubTask).toHaveBeenCalledWith('sub-1', 'task-1', 'tag-1');

    addToSubTask.mockClear();
    drop({ type: 'subtask', id: 'sub-2' });
    drop(null);
    expect(addToSubTask).not.toHaveBeenCalled();
  });
});
