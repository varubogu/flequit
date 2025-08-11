import { getTranslationService } from '$lib/stores/locale.svelte';
import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
import { taskStore } from '$lib/stores/tasks.svelte';
import { calculateSubTaskProgress } from '$lib/utils/task-utils';
import { TaskService } from '$lib/services/task-service';
import { TaskDetailService } from '$lib/services/task-detail-service';
import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';
import { createEventDispatcher } from 'svelte';
import { Edit, Trash2 } from 'lucide-svelte';
import type { ContextMenuList } from '$lib/types/context-menu';
import { createContextMenu, createSeparator } from '$lib/types/context-menu';

export class TaskItemLogic {
  // Props (initialized in constructor)
  task: TaskWithSubTasks;
  onTaskClick?: (taskId: string) => void;
  onSubTaskClick?: (subTaskId: string) => void;

  // State
  showSubTasks = $state(false);

  // Dispatcher
  private dispatch = createEventDispatcher<{
    taskSelectionRequested: { taskId: string };
    subTaskSelectionRequested: { subTaskId: string };
  }>();

  // Translation service
  private translationService = getTranslationService();

  // Derived states (initialized after task is set)
  isSelected!: boolean;
  hasSelectedSubTask!: boolean;
  isActiveTask!: boolean;
  completedSubTasks!: number;
  subTaskProgress!: number;

  // Translation messages
  editTask = this.translationService.getMessage('edit_task');
  deleteTask = this.translationService.getMessage('delete_task');
  editSubtask = this.translationService.getMessage('edit_subtask');
  deleteSubtask = this.translationService.getMessage('delete_subtask');

  constructor(
    task: TaskWithSubTasks,
    onTaskClick?: (taskId: string) => void,
    onSubTaskClick?: (subTaskId: string) => void,
    dispatcher?: ReturnType<typeof createEventDispatcher>
  ) {
    this.task = task;
    this.onTaskClick = onTaskClick;
    this.onSubTaskClick = onSubTaskClick;
    if (dispatcher) {
      this.dispatch = dispatcher;
    }

    // Initialize derived states after task is set
    this.isSelected = $derived(taskStore.selectedTaskId === this.task.id);
    this.hasSelectedSubTask = $derived(
      this.task.sub_tasks.some((st) => st.id === taskStore.selectedSubTaskId)
    );
    this.isActiveTask = $derived(this.isSelected || this.hasSelectedSubTask);
    this.completedSubTasks = $derived(
      this.task.sub_tasks.filter((st) => st.status === 'completed').length
    );
    this.subTaskProgress = $derived(
      calculateSubTaskProgress(this.completedSubTasks, this.task.sub_tasks.length)
    );
  }

  // Task handlers
  handleEditTask() {
    // タスク詳細画面を開いて編集モードにする
    TaskDetailService.openTaskDetail(this.task.id);
  }

  handleDeleteTask() {
    TaskService.deleteTask(this.task.id);
  }

  handleEditSubTask(subTask: SubTask) {
    // サブタスク詳細画面を開いて編集モードにする
    TaskDetailService.openSubTaskDetail(subTask.id);
  }

  handleDeleteSubTask(subTask: SubTask) {
    // サブタスクを削除
    TaskService.deleteSubTask(subTask.id);
  }

  // Context menus
  taskContextMenuItems = $derived(
    createContextMenu([
      {
        id: 'edit-task',
        label: this.editTask,
        action: this.handleEditTask.bind(this),
        icon: Edit
      },
      createSeparator(),
      {
        id: 'delete-task',
        label: this.deleteTask,
        action: this.handleDeleteTask.bind(this),
        icon: Trash2,
        destructive: true
      }
    ])
  );

  createSubTaskContextMenu(subTask: SubTask): ContextMenuList {
    return createContextMenu([
      {
        id: 'edit-subtask',
        label: this.editSubtask,
        action: () => this.handleEditSubTask(subTask),
        icon: Edit
      },
      createSeparator(),
      {
        id: 'delete-subtask',
        label: this.deleteSubtask,
        action: () => this.handleDeleteSubTask(subTask),
        icon: Trash2,
        destructive: true
      }
    ]);
  }

  handleTaskClick() {
    // モバイル時のカスタムハンドラーがある場合は優先
    if (this.onTaskClick) {
      this.onTaskClick(this.task.id);
      return;
    }

    // Try to select task, but if blocked due to new task mode, dispatch event for confirmation
    const success = TaskService.selectTask(this.task.id);
    if (!success) {
      this.dispatch('taskSelectionRequested', { taskId: this.task.id });
    }
  }

  handleStatusToggle() {
    TaskService.toggleTaskStatus(this.task.id);
  }

  handleSubTaskToggle(event: Event | undefined, subTaskId: string) {
    event?.stopPropagation();
    TaskService.toggleSubTaskStatus(this.task, subTaskId);
  }

  handleSubTaskClick(event: Event | undefined, subTaskId: string) {
    event?.stopPropagation();

    if (this.onSubTaskClick) {
      this.onSubTaskClick(subTaskId);
    } else {
      // フォールバック: 統一的なアプローチを使わない場合
      const success = TaskService.selectSubTask(subTaskId);
      if (!success) {
        this.dispatch('subTaskSelectionRequested', { subTaskId });
      }
    }
  }

  toggleSubTasksAccordion(event?: Event) {
    event?.stopPropagation();
    this.showSubTasks = !this.showSubTasks;
  }

  // Drag & Drop handlers
  handleDragStart(event: DragEvent) {
    const dragData: DragData = {
      type: 'task',
      id: this.task.id
    };
    DragDropManager.startDrag(event, dragData);
  }

  handleDragOver(event: DragEvent) {
    const target: DropTarget = {
      type: 'task',
      id: this.task.id
    };
    DragDropManager.handleDragOver(event, target);
  }

  handleDrop(event: DragEvent) {
    const target: DropTarget = {
      type: 'task',
      id: this.task.id
    };

    const dragData = DragDropManager.handleDrop(event, target);
    if (!dragData) return;

    if (dragData.type === 'tag') {
      // タグをタスクにドロップした場合、タグを付与
      TaskService.addTagToTask(this.task.id, dragData.id);
    }
  }

  handleDragEnd(event: DragEvent) {
    DragDropManager.handleDragEnd(event);
  }

  handleDragEnter(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragEnter(event, element);
  }

  handleDragLeave(event: DragEvent, element: HTMLElement) {
    DragDropManager.handleDragLeave(event, element);
  }
}
