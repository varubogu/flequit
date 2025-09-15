<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { ProjectTree } from '$lib/types/project';
  import type { ViewType } from '$lib/services/view-service';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import TaskListDialog from '$lib/components/task/dialogs/task-list-dialog.svelte';
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import { Edit, Plus, Trash2 } from 'lucide-svelte';
  import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
  import type { ContextMenuList } from '$lib/types/context-menu';
  import { createContextMenu, createSeparator } from '$lib/types/context-menu';
  import { TaskDetailService } from '$lib/services/task-detail-service';

  interface Props {
    project: ProjectTree;
    isExpanded: boolean;
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
  }

  let { project, isExpanded, currentView = 'all', onViewChange }: Props = $props();

  // taskStore.projectsから直接参照して確実にリアクティブにする
  let currentProject = $derived(taskStore.projects.find(p => p.id === project.id));

  const translationService = getTranslationService();
  const editTaskList = translationService.getMessage('edit_task_list');
  const addTask = translationService.getMessage('add_task');
  const deleteTaskList = translationService.getMessage('delete_task_list');

  function handleTaskListSelect(list: { id: string }) {
    taskStore.selectList(list.id);
    onViewChange?.('tasklist');
  }

  let showTaskListDialog = $state(false);
  let taskListDialogMode: 'add' | 'edit' = $state('add');
  let editingTaskList: { id: string; name: string } | null = $state(null);
  let editingProject: ProjectTree | null = $state(null);

  function openTaskListDialog(
    mode: 'add' | 'edit',
    taskList?: { id: string; name: string },
    project?: ProjectTree
  ) {
    taskListDialogMode = mode;
    editingTaskList = taskList ?? null;
    editingProject = project ?? null;
    showTaskListDialog = true;
  }

  async function handleTaskListSave(data: { name: string }) {
    const { name } = data;
    if (taskListDialogMode === 'add') {
      if (editingProject) {
        const newTaskList = await taskStore.addTaskList(editingProject.id, { name });
        if (newTaskList) {
          taskStore.selectList(newTaskList.id);
          onViewChange?.('tasklist');
        }
      }
    } else {
      if (editingTaskList) {
        await taskStore.updateTaskList(editingTaskList.id, { name });
      }
    }
    showTaskListDialog = false;
  }

  // Drag & Drop handlers
  function handleTaskListDragStart(event: DragEvent, list: { id: string }) {
    const dragData: DragData = {
      type: 'tasklist',
      id: list.id,
      projectId: project.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  function handleTaskListDragOver(event: DragEvent, list: { id: string }) {
    const target: DropTarget = {
      type: 'tasklist',
      id: list.id,
      projectId: project.id
    };
    DragDropManager.handleDragOver(event, target);
  }

  async function handleTaskListDrop(event: DragEvent, targetList: { id: string }) {
    const target: DropTarget = {
      type: 'tasklist',
      id: targetList.id,
      projectId: project.id
    };

    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'tasklist') {
      // タスクリスト同士の並び替えまたは別プロジェクトから移動
      const targetIndex = project.task_lists.findIndex((tl) => tl.id === targetList.id);
      await taskStore.moveTaskListToPosition(dragData.id, project.id, targetIndex);
    } else if (dragData.type === 'task') {
      // タスクをタスクリストにドロップ
      await taskStore.moveTaskToList(dragData.id, targetList.id);
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

  // タスク追加処理
  function handleAddTaskToList(list: { id: string; name: string }) {
    // 新規タスクモードを開始
    taskStore.startNewTaskMode(list.id);

    // タスク詳細を表示
    TaskDetailService.openNewTaskDetail();
  }

  // タスクリスト用のコンテキストメニューリストを作成
  function createTaskListContextMenu(list: { id: string; name: string }): ContextMenuList {
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
        action: () => handleAddTaskToList(list),
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

{#if isExpanded && currentProject}
  <div class="mt-1 ml-4 space-y-1">
    {#each currentProject.task_lists as list (list.id)}
      <ContextMenuWrapper items={createTaskListContextMenu(list)}>
        <Button
          variant={currentView === 'tasklist' &&
            taskStore.selectedListId === list.id ? 'secondary' : 'ghost'}
          size="sm"
          class={`${
            currentView === 'tasklist' && taskStore.selectedListId === list.id
              ? 'bg-primary/20 border-2 border-primary shadow-md shadow-primary/40 text-foreground'
              : ''
          } flex h-auto w-full items-center justify-between p-2 text-xs transition-all duration-100 active:scale-100 active:brightness-[0.4]`}
          onclick={() => handleTaskListSelect(list)}
          data-testid="tasklist-{list.id}"
          draggable="true"
          ondragstart={(event) => handleTaskListDragStart(event, list)}
          ondragover={(event) => handleTaskListDragOver(event, list)}
          ondrop={(event) => handleTaskListDrop(event, list)}
          ondragend={handleTaskListDragEnd}
          ondragenter={(event) =>
            event.currentTarget &&
            handleTaskListDragEnter(event, event.currentTarget as HTMLElement)}
          ondragleave={(event) =>
            event.currentTarget &&
            handleTaskListDragLeave(event, event.currentTarget as HTMLElement)}
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
  onclose={() => (showTaskListDialog = false)}
/>
