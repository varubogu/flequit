import type { Tag } from '$lib/types/tag';
import { tagStore } from '$lib/stores/tags.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { viewStore } from '$lib/stores/view-store.svelte';
import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
import { taskMutations } from '$lib/services/domain/task/task-mutations-instance';
import { SubTaskMutations } from '$lib/services/domain/subtask';
import { TagService } from '$lib/services/domain/tag';

const subTaskMutations = new SubTaskMutations();

interface DialogState {
  selectedTag: Tag | null;
  showEditDialog: boolean;
  showDeleteConfirm: boolean;
}

export function useSidebarTagListController() {
  // Dialog state
  const dialogState = $state<DialogState>({
    selectedTag: null,
    showEditDialog: false,
    showDeleteConfirm: false
  });

  // Derived state - Use getter function for better testability
  const getBookmarkedTags = () => tagStore.bookmarkedTagList;

  // Tag action handlers
  function handleTagClick(tag: Tag) {
    const searchQuery = `#${tag.name}`;
    viewStore.performSearch(searchQuery);
  }

  function handleRemoveFromBookmarks(tag: Tag) {
    tagStore.removeBookmark(tag.id);
  }

  function handleEditTag(tag: Tag) {
    dialogState.selectedTag = tag;
    dialogState.showEditDialog = true;
  }

  function handleDeleteTag(tag: Tag) {
    dialogState.selectedTag = tag;
    dialogState.showDeleteConfirm = true;
  }

  // Dialog handlers
  function onEditComplete() {
    dialogState.showEditDialog = false;
    dialogState.selectedTag = null;
  }

  async function onEditSave(data: { name: string; color: string }) {
    if (dialogState.selectedTag) {
      const projectId = await tagStore.getProjectIdByTagId(dialogState.selectedTag.id);
      if (!projectId) {
        console.error('Project ID not found for tag:', dialogState.selectedTag.id);
        return;
      }
      TagService.updateTag(projectId, dialogState.selectedTag.id, {
        name: data.name,
        color: data.color
      });
    }
    onEditComplete();
  }

  async function onDeleteConfirm() {
    if (dialogState.selectedTag) {
      const projectId = await tagStore.getProjectIdByTagId(dialogState.selectedTag.id);
      if (!projectId) {
        console.error('Project ID not found for tag:', dialogState.selectedTag.id);
        return;
      }
      TagService.deleteTag(projectId, dialogState.selectedTag.id, (tagId: string) => {
        taskStore.removeTagFromAllTasks(tagId);
      });
      dialogState.showDeleteConfirm = false;
      dialogState.selectedTag = null;
    }
  }

  function onDeleteCancel() {
    dialogState.showDeleteConfirm = false;
    dialogState.selectedTag = null;
  }

  // Drag & Drop handlers
  function handleTagDragStart(event: DragEvent, tag: Tag) {
    const dragData: DragData = {
      type: 'tag',
      id: tag.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  function handleTagDragOver(event: DragEvent, tag: Tag) {
    const target: DropTarget = {
      type: 'tag',
      id: tag.id
    };
    DragDropManager.handleDragOver(event, target);
  }

  function handleTagDrop(event: DragEvent, targetTag: Tag) {
    const target: DropTarget = {
      type: 'tag',
      id: targetTag.id
    };

    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'tag') {
      const targetIndex = getBookmarkedTags().findIndex((t) => t.id === targetTag.id);
      tagStore.moveBookmarkedTagToPosition(dragData.id, targetIndex);
    } else if (dragData.type === 'task') {
      void taskMutations.addTagToTask(dragData.id, targetTag.id);
    } else if (dragData.type === 'subtask' && dragData.taskId) {
      void subTaskMutations.addTagToSubTask(dragData.id, dragData.taskId, targetTag.id);
    }
  }

  function handleTagDragEnd(event: DragEvent) {
    DragDropManager.handleDragEnd(event);
  }

  function handleTagDragEnter(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragEnter(event, element);
  }

  function handleTagDragLeave(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragLeave(event, element);
  }

  return {
    // State
    get bookmarkedTags() {
      return getBookmarkedTags();
    },
    get selectedTag() {
      return dialogState.selectedTag;
    },
    get showEditDialog() {
      return dialogState.showEditDialog;
    },
    get showDeleteConfirm() {
      return dialogState.showDeleteConfirm;
    },

    // Tag actions
    handleTagClick,
    handleRemoveFromBookmarks,
    handleEditTag,
    handleDeleteTag,

    // Dialog handlers
    onEditComplete,
    onEditSave,
    onDeleteConfirm,
    onDeleteCancel,

    // Drag & Drop handlers
    handleTagDragStart,
    handleTagDragOver,
    handleTagDrop,
    handleTagDragEnd,
    handleTagDragEnter,
    handleTagDragLeave
  };
}
