<script lang="ts">
  import type { ProjectTree } from '$lib/types/task';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import TaskListDialog from '$lib/components/task/task-list-dialog.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import { Edit, Plus, Trash2 } from 'lucide-svelte';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';

  interface Props {
    project: ProjectTree;
    isExpanded: boolean;
    onViewChange?: (view: any) => void;
  }

  let { project, isExpanded, onViewChange }: Props = $props();

  const editTaskList = reactiveMessage(m.edit_task_list);
  const addTask = reactiveMessage(m.add_task);
  const deleteTaskList = reactiveMessage(m.delete_task_list);

  function handleTaskListSelect(list: any) {
    taskStore.selectList(list.id);
    onViewChange?.('tasklist');
  }

  let showTaskListDialog = $state(false);
  let taskListDialogMode: 'add' | 'edit' = $state('add');
  let editingTaskList: any = $state(null);
  let editingProject: any = $state(null);

  function openTaskListDialog(mode: 'add' | 'edit', taskList?: any, project?: any) {
    taskListDialogMode = mode;
    editingTaskList = taskList;
    editingProject = project;
    showTaskListDialog = true;
  }

  function handleTaskListSave(data: { name: string }) {
    const { name } = data;
    if (taskListDialogMode === 'add') {
      if (editingProject) {
        const newTaskList = taskStore.addTaskList(editingProject.id, { name });
        if (newTaskList) {
          taskStore.selectList(newTaskList.id);
          onViewChange?.('tasklist');
        }
      }
    } else {
      if (editingTaskList) {
        taskStore.updateTaskList(editingTaskList.id, { name });
      }
    }
    showTaskListDialog = false;
  }

  // Drag & Drop handlers
  function handleTaskListDragStart(event: DragEvent, list: any) {
    const dragData: DragData = {
      type: 'tasklist',
      id: list.id,
      projectId: project.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  function handleTaskListDragOver(event: DragEvent, list: any) {
    const target: DropTarget = {
      type: 'tasklist',
      id: list.id,
      projectId: project.id
    };
    DragDropManager.handleDragOver(event, target);
  }

  function handleTaskListDrop(event: DragEvent, targetList: any) {
    const target: DropTarget = {
      type: 'tasklist',
      id: targetList.id,
      projectId: project.id
    };
    
    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'tasklist') {
      // タスクリスト同士の並び替えまたは別プロジェクトから移動
      const targetIndex = project.task_lists.findIndex(tl => tl.id === targetList.id);
      taskStore.moveTaskListToPosition(dragData.id, project.id, targetIndex);
    } else if (dragData.type === 'task') {
      // タスクをタスクリストにドロップ
      taskStore.moveTaskToList(dragData.id, targetList.id);
    }
  }

  function handleTaskListDragEnd(event: DragEvent) {
    DragDropManager.handleDragEnd(event);
  }

  function handleTaskListDragEnter(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragEnter(event, element);
  }

  function handleTaskListDragLeave(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragLeave(event, element);
  }

  // タスクリスト用のコンテキストメニューリストを作成
  function createTaskListContextMenu(list: any): ContextMenuList {
    return createContextMenu([
      {
        id: 'edit-task-list',
        label: editTaskList,
        action: () => openTaskListDialog('edit', list, project),
        icon: Edit
      },
      {
        id: 'add-task',
        label: addTask,
        action: () => console.log('Add task to:', list.name),
        icon: Plus
      },
      createSeparator(),
      {
        id: 'delete-task-list',
        label: deleteTaskList,
        action: () => taskStore.deleteTaskList(list.id),
        icon: Trash2,
        destructive: true
      }
    ]);
  }
</script>

{#if isExpanded}
  <div class="ml-4 mt-1 space-y-1">
    {#each project.task_lists as list (list.id)}
      <ContextMenuWrapper items={createTaskListContextMenu(list)}>
        <Button
          variant={taskStore.selectedListId === list.id ? 'secondary' : 'ghost'}
          size="sm"
          class="flex items-center justify-between w-full h-auto p-2 text-xs active:scale-100 active:brightness-[0.4] transition-all duration-100"
          onclick={() => handleTaskListSelect(list)}
          data-testid="tasklist-{list.id}"
          draggable="true"
          ondragstart={(event) => handleTaskListDragStart(event, list)}
          ondragover={(event) => handleTaskListDragOver(event, list)}
          ondrop={(event) => handleTaskListDrop(event, list)}
          ondragend={handleTaskListDragEnd}
          ondragenter={(event) => event.currentTarget && handleTaskListDragEnter(event, event.currentTarget as HTMLElement)}
          ondragleave={(event) => event.currentTarget && handleTaskListDragLeave(event, event.currentTarget as HTMLElement)}
        >
          <span class="truncate">{list.name}</span>
          <span class="text-muted-foreground">
            {list.tasks.length}
          </span>
        </Button>
      </ContextMenuWrapper>
    {/each}
  </div>
{/if}

<TaskListDialog
  open={showTaskListDialog}
  mode={taskListDialogMode}
  initialName={editingTaskList?.name || ''}
  onsave={handleTaskListSave}
  onclose={() => showTaskListDialog = false}
/>
