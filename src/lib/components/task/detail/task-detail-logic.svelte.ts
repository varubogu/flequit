import { taskStore } from '$lib/stores/tasks.svelte';
import type { TaskStatus } from '$lib/types/task';
import type { RecurrenceRule } from '$lib/types/recurrence';
import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
import {
  fromLegacyRecurrenceRule,
  toLegacyRecurrenceRule
} from '$lib/utils/recurrence-converter';
import { TaskService } from '$lib/services/task-service';
import { getTranslationService } from '$lib/stores/locale.svelte';
import { SvelteDate } from 'svelte/reactivity';
import { getBackendService } from '$lib/infrastructure/backends/index';

export class TaskDetailLogic {
  // Core derived states
  task = $derived(taskStore.selectedTask);
  subTask = $derived(taskStore.selectedSubTask);
  currentItem = $derived(
    this.task || this.subTask || (taskStore.isNewTaskMode ? taskStore.newTaskData : null)
  );
  isSubTask = $derived(!!this.subTask);
  isNewTaskMode = $derived(taskStore.isNewTaskMode);


  // Form state
  editForm = $state({
    title: '',
    description: '',
    plan_start_date: undefined as Date | undefined,
    plan_end_date: undefined as Date | undefined,
    is_range_date: false,
    priority: 0,
    recurrenceRule: undefined as RecurrenceRule | undefined
  });

  // UI層に渡すための変換済みフォーム
  editFormForUI = $derived({
    ...this.editForm,
    recurrenceRule: toLegacyRecurrenceRule(this.editForm.recurrenceRule)
  });

  // UI states
  showDatePicker = $state(false);
  datePickerPosition = $state({ x: 0, y: 0 });
  showConfirmationDialog = $state(false);
  showDeleteDialog = $state(false);
  showProjectTaskListDialog = $state(false);
  showRecurrenceDialog = $state(false);
  showSubTaskAddForm = $state(false);

  // Action states
  pendingAction = $state<(() => void) | null>(null);
  pendingDeleteAction = $state<(() => void) | null>(null);
  deleteDialogTitle = $state('');
  deleteDialogMessage = $state('');

  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private translationService = getTranslationService();

  constructor() {
    // Watch for pending selections from taskStore
    $effect(() => {
      if (taskStore.pendingTaskSelection) {
        const taskId = taskStore.pendingTaskSelection;
        this.showConfirmationIfNeeded(() => {
          TaskService.forceSelectTask(taskId);
          taskStore.clearPendingSelections();
        });
      }
    });

    $effect(() => {
      if (taskStore.pendingSubTaskSelection) {
        const subTaskId = taskStore.pendingSubTaskSelection;
        this.showConfirmationIfNeeded(() => {
          TaskService.forceSelectSubTask(subTaskId);
          taskStore.clearPendingSelections();
        });
      }
    });

    // Sync form with current item
    $effect(() => {
      if (this.currentItem) {
        this.editForm = {
          title: this.currentItem.title,
          description: this.currentItem.description || '',
          plan_start_date: this.currentItem.planStartDate,
          plan_end_date: this.currentItem.planEndDate,
          is_range_date: this.currentItem.isRangeDate || false,
          priority: this.currentItem.priority || 0,
          recurrenceRule: fromLegacyRecurrenceRule(this.currentItem.recurrenceRule)
        };
      }
    });
  }

  // Project info getter
  getProjectInfo() {
    if (this.isNewTaskMode || !this.currentItem) return null;
    if (this.isSubTask && 'taskId' in this.currentItem) {
      return taskStore.getTaskProjectAndList(this.currentItem.taskId);
    } else {
      return taskStore.getTaskProjectAndList(this.currentItem.id);
    }
  }

  // Form handling
  debouncedSave() {
    console.log('[TaskDetailLogic] debouncedSave called, stack:', new Error().stack);
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      console.log('[TaskDetailLogic] debouncedSave timeout fired, updating task');
      if (this.currentItem) {
        const updates = {
          title: this.editForm.title,
          description: this.editForm.description || undefined,
          priority: this.editForm.priority,
          planStartDate: this.editForm.plan_start_date,
          planEndDate: this.editForm.plan_end_date,
          isRangeDate: this.editForm.is_range_date,
          recurrenceRule: toLegacyRecurrenceRule(this.editForm.recurrenceRule)
        };

        if (this.isNewTaskMode) {
          taskStore.updateNewTaskData(updates);
        } else if (this.isSubTask) {
          taskStore.updateSubTask(this.currentItem.id, updates);
        } else {
          taskStore.updateTask(this.currentItem.id, updates);
        }
      }
    }, 500);
  }

  // 即座に保存するメソッド（日付変更などでタスク一覧との同期が必要な場合）
  saveImmediately() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    if (this.currentItem) {
      const convertedRule = toLegacyRecurrenceRule(this.editForm.recurrenceRule);

      const updates = {
        title: this.editForm.title,
        description: this.editForm.description || undefined,
        priority: this.editForm.priority,
        planStartDate: this.editForm.plan_start_date,
        planEndDate: this.editForm.plan_end_date,
        isRangeDate: this.editForm.is_range_date,
        recurrenceRule: convertedRule
      };

      if (this.isNewTaskMode) {
        taskStore.updateNewTaskData(updates);
      } else if (this.isSubTask) {
        taskStore.updateSubTask(this.currentItem.id, updates);
      } else {
        taskStore.updateTask(this.currentItem.id, updates);
      }
    }
  }

  handleFormChange() {
    console.log('[TaskDetailLogic] handleFormChange called, stack:', new Error().stack);
    this.debouncedSave();
  }

  handleTitleChange(title: string) {
    this.editForm.title = title;
    this.handleFormChange();
  }

  handleDescriptionChange(description: string) {
    this.editForm.description = description;
    this.handleFormChange();
  }

  handlePriorityChange(priority: number) {
    this.editForm.priority = priority;
  }

  // Status handling
  handleStatusChange(event: Event) {
    if (!this.currentItem) return;
    const target = event.target as HTMLSelectElement;

    if (this.isNewTaskMode) {
      taskStore.updateNewTaskData({ status: target.value as TaskStatus });
    } else if (this.isSubTask) {
      TaskService.changeSubTaskStatus(this.currentItem.id, target.value as TaskStatus);
    } else {
      TaskService.changeTaskStatus(this.currentItem.id, target.value as TaskStatus);
    }
  }

  // Date handling
  handleDueDateClick(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    const rect = event?.target
      ? (event.target as HTMLElement).getBoundingClientRect()
      : { left: 0, bottom: 0 };
    this.datePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };
    this.showDatePicker = true;
  }

  async handleDateChange(data: {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
    recurrenceRule?: LegacyRecurrenceRule | null;
  }) {
    const { dateTime, range, isRangeDate, recurrenceRule } = data;

    if (isRangeDate) {
      if (range) {
        this.editForm = {
          ...this.editForm,
          plan_start_date: new SvelteDate(range.start),
          plan_end_date: new SvelteDate(range.end),
          is_range_date: true
        };
      } else {
        const currentEndDate = this.editForm.plan_end_date || new SvelteDate(dateTime);
        this.editForm = {
          ...this.editForm,
          plan_start_date: currentEndDate,
          plan_end_date: currentEndDate,
          is_range_date: true
        };
      }
    } else {
      this.editForm = {
        ...this.editForm,
        plan_end_date: new SvelteDate(dateTime),
        plan_start_date: undefined,
        is_range_date: false
      };
    }

    // recurrenceRuleが渡された場合、editFormを更新してバックエンドに保存
    if (recurrenceRule !== undefined) {
      this.editForm = {
        ...this.editForm,
        recurrenceRule: fromLegacyRecurrenceRule(recurrenceRule)
      };

      // 繰り返しルール変更をバックエンドに保存
      await this.handleRecurrenceChange(recurrenceRule);
    }

    // 日付変更は即座に保存してタスク一覧に反映させる
    this.saveImmediately();
  }

  handleDateClear() {
    this.editForm = {
      ...this.editForm,
      plan_start_date: undefined,
      plan_end_date: undefined,
      is_range_date: false
    };
    // 日付クリアも即座に保存してタスク一覧に反映させる
    this.saveImmediately();
  }

  handleDatePickerClose() {
    this.showDatePicker = false;
  }

  // Task actions
  handleDelete() {
    if (!this.currentItem) return;
    if (this.isNewTaskMode) {
      taskStore.cancelNewTaskMode();
      return;
    }

    const currentItem = this.currentItem; // Type guard to satisfy TypeScript

    if (this.isSubTask) {
      this.deleteDialogTitle = this.translationService.getMessage('delete_subtask_title')();
      this.deleteDialogMessage = this.translationService.getMessage('delete_subtask_message')();
      this.pendingDeleteAction = () => TaskService.deleteSubTask(currentItem.id);
    } else {
      this.deleteDialogTitle = this.translationService.getMessage('delete_task_title')();
      this.deleteDialogMessage = this.translationService.getMessage('delete_task_message')();
      this.pendingDeleteAction = () => TaskService.deleteTask(currentItem.id);
    }

    this.showDeleteDialog = true;
  }

  async handleSaveNewTask() {
    if (!this.isNewTaskMode) return;
    const newTaskId = await taskStore.saveNewTask();
    if (newTaskId) {
      TaskService.selectTask(newTaskId);
    }
  }

  handleSubTaskToggle(subTaskId: string) {
    if (!this.task) return;
    TaskService.toggleSubTaskStatus(this.task, subTaskId);
  }

  handleSubTaskClick(subTaskId: string) {
    TaskService.selectSubTask(subTaskId);
  }

  handleAddSubTask() {
    this.showSubTaskAddForm = !this.showSubTaskAddForm;
  }

  async handleSubTaskAdded(title: string) {
    if (!this.task || !title.trim()) return;

    const newSubTask = await TaskService.addSubTask(this.task.id, {
      title: title.trim()
    });

    if (newSubTask) {
      this.showSubTaskAddForm = false;
      // サブタスクは連続入力することが多いため、自動選択はしない
      // タスク詳細画面は現在のメインタスクを維持
    }
  }

  handleSubTaskAddCancel() {
    this.showSubTaskAddForm = false;
  }

  handleGoToParentTask() {
    if (this.isSubTask && this.currentItem && 'taskId' in this.currentItem) {
      TaskService.selectTask(this.currentItem.taskId);
    }
  }

  // Project/TaskList handling
  handleProjectTaskListEdit() {
    this.showProjectTaskListDialog = true;
  }

  async handleProjectTaskListChange(data: { projectId: string; taskListId: string }) {
    if (!this.currentItem || this.isNewTaskMode) return;

    if (this.isSubTask) {
      if ('taskId' in this.currentItem) {
        await taskStore.moveTaskToList(this.currentItem.taskId, data.taskListId);
      }
    } else {
      await taskStore.moveTaskToList(this.currentItem.id, data.taskListId);
    }
    this.showProjectTaskListDialog = false;
  }

  handleProjectTaskListDialogClose() {
    this.showProjectTaskListDialog = false;
  }

  // Confirmation handling
  showConfirmationIfNeeded(action: () => void): boolean {
    if (this.isNewTaskMode && this.editForm.title.trim()) {
      this.pendingAction = action;
      this.showConfirmationDialog = true;
      return false;
    }
    action();
    return true;
  }

  handleConfirmDiscard() {
    this.showConfirmationDialog = false;
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
  }

  handleCancelDiscard() {
    this.showConfirmationDialog = false;
    this.pendingAction = null;
    taskStore.clearPendingSelections();
  }

  handleConfirmDelete() {
    this.showDeleteDialog = false;
    if (this.pendingDeleteAction) {
      this.pendingDeleteAction();
      this.pendingDeleteAction = null;
    }
  }

  handleCancelDelete() {
    this.showDeleteDialog = false;
    this.pendingDeleteAction = null;
  }

  // Recurrence handling
  async handleRecurrenceChange(rule: LegacyRecurrenceRule | null) {
    if (!this.currentItem || this.isNewTaskMode) {
      return;
    }

    // タスク/サブタスクからprojectIdを取得
    const projectId = this.isSubTask && 'taskId' in this.currentItem
      ? taskStore.getTaskProjectAndList(this.currentItem.taskId)?.project.id
      : taskStore.getTaskProjectAndList(this.currentItem.id)?.project.id;

    if (!projectId) {
      console.error('Failed to get projectId for recurrence rule');
      return;
    }

    // 既存のRecurrenceRule型から統一型に変換
    const unifiedRule = fromLegacyRecurrenceRule(rule);

    // Note: editFormは更新しない - RecurrenceRuleの変更はバックエンドに保存するのみ
    // editFormの更新はcurrentItemの再読み込み時に行われる

    // BackendServiceを取得
    const backend = await getBackendService();

    try {
      if (rule === null) {
        // 繰り返しルールを削除
        if (this.isSubTask) {
          await backend.subtaskRecurrence.delete(projectId, this.currentItem.id);
        } else {
          await backend.taskRecurrence.delete(projectId, this.currentItem.id);
        }
      } else {
        // 既存の繰り返し関連付けを確認
        const existing = this.isSubTask
          ? await backend.subtaskRecurrence.getBySubtaskId(projectId, this.currentItem.id)
          : await backend.taskRecurrence.getByTaskId(projectId, this.currentItem.id);

        if (existing) {
          // 既存のRecurrenceRuleを更新
          await backend.recurrenceRule.update(projectId, { ...unifiedRule!, id: existing.recurrenceRuleId });
        } else {
          // 新規RecurrenceRuleを作成
          const ruleId = crypto.randomUUID();
          await backend.recurrenceRule.create(projectId, { ...unifiedRule!, id: ruleId });

          // 関連付けを作成
          if (this.isSubTask) {
            await backend.subtaskRecurrence.create(projectId, {
              subtaskId: this.currentItem.id,
              recurrenceRuleId: ruleId
            });
          } else {
            await backend.taskRecurrence.create(projectId, {
              taskId: this.currentItem.id,
              recurrenceRuleId: ruleId
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to save recurrence rule:', error);
      // Note: editFormは更新していないため、ロールバック処理は不要
    }

    this.showRecurrenceDialog = false;
  }

  handleRecurrenceDialogClose(open?: boolean) {
    // openパラメータが渡された場合（onOpenChangeから呼ばれた場合）
    if (typeof open === 'boolean') {
      this.showRecurrenceDialog = open;
    } else {
      // 直接呼ばれた場合（従来の動作）
      this.showRecurrenceDialog = false;
    }
  }
}
