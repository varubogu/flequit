<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { subTaskStore } from '$lib/stores/sub-task-store.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import TaskDetailContent from './task-detail-content.svelte';
  import TaskDetailDialogs from '../dialogs/task-detail-dialogs.svelte';
  import type { TaskStatus } from '$lib/types/task';
  import type { RecurrenceRule } from '$lib/types/recurrence';
  import type { RecurrenceRule as LegacyRecurrenceRule } from '$lib/types/datetime-calendar';
  import {
    fromLegacyRecurrenceRule,
    toLegacyRecurrenceRule
  } from '$lib/utils/recurrence-converter';
  import { TaskService } from '$lib/services/domain/task';
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import { SvelteDate } from 'svelte/reactivity';
  import { getBackendService } from '$lib/infrastructure/backends/index';

  interface Props {
    isDrawerMode?: boolean;
  }

  let { isDrawerMode = false }: Props = $props();

  // Translation service
  const translationService = getTranslationService();

  // Core derived states
  const task = $derived(taskStore.selectedTask);
  const subTask = $derived(taskStore.selectedSubTask);
  const isSubTask = $derived(!!subTask);
  const isNewTaskMode = $derived(taskStore.isNewTaskMode);
  const currentItem = $derived(
    task || subTask || (isNewTaskMode ? taskStore.newTaskData : null)
  );

  // Form state
  let editForm = $state({
    title: '',
    description: '',
    plan_start_date: undefined as Date | undefined,
    plan_end_date: undefined as Date | undefined,
    is_range_date: false,
    priority: 0,
    recurrenceRule: undefined as RecurrenceRule | undefined
  });

  // UI層に渡すための変換済みフォーム
  const editFormForUI = $derived.by(() => ({
    title: editForm.title,
    description: editForm.description,
    plan_start_date: editForm.plan_start_date,
    plan_end_date: editForm.plan_end_date,
    is_range_date: editForm.is_range_date,
    priority: editForm.priority,
    recurrenceRule: toLegacyRecurrenceRule(editForm.recurrenceRule)
  }));

  // UI states
  let showDatePicker = $state(false);
  let datePickerPosition = $state({ x: 0, y: 0 });
  let showConfirmationDialog = $state(false);
  let showDeleteDialog = $state(false);
  let showProjectTaskListDialog = $state(false);
  let showRecurrenceDialog = $state(false);
  let showSubTaskAddForm = $state(false);

  // Action states
  let pendingAction = $state<(() => void) | null>(null);
  let pendingDeleteAction = $state<(() => void) | null>(null);
  let deleteDialogTitle = $state('');
  let deleteDialogMessage = $state('');

  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  // Project info getter
  function getProjectInfo() {
    if (isNewTaskMode || !currentItem) return null;
    if (isSubTask && 'taskId' in currentItem) {
      return taskStore.getTaskProjectAndList(currentItem.taskId);
    } else {
      return taskStore.getTaskProjectAndList(currentItem.id);
    }
  }

  // Form handling
  function debouncedSave() {
    console.log('[TaskDetailLogic] debouncedSave called, stack:', new Error().stack);
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      console.log('[TaskDetailLogic] debouncedSave timeout fired, updating task');
      if (currentItem) {
        const updates = {
          title: editForm.title,
          description: editForm.description || undefined,
          priority: editForm.priority,
          planStartDate: editForm.plan_start_date,
          planEndDate: editForm.plan_end_date,
          isRangeDate: editForm.is_range_date,
          recurrenceRule: toLegacyRecurrenceRule(editForm.recurrenceRule)
        };

        if (isNewTaskMode) {
          taskStore.updateNewTaskData(updates);
        } else if (isSubTask) {
          subTaskStore.updateSubTask(currentItem.id, updates);
        } else {
          taskStore.updateTask(currentItem.id, updates);
        }
      }
    }, 500);
  }

  // 即座に保存するメソッド（日付変更などでタスク一覧との同期が必要な場合）
  function saveImmediately() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    if (currentItem) {
      const convertedRule = toLegacyRecurrenceRule(editForm.recurrenceRule);

      const updates = {
        title: editForm.title,
        description: editForm.description || undefined,
        priority: editForm.priority,
        planStartDate: editForm.plan_start_date,
        planEndDate: editForm.plan_end_date,
        isRangeDate: editForm.is_range_date,
        recurrenceRule: convertedRule
      };

      if (isNewTaskMode) {
        taskStore.updateNewTaskData(updates);
      } else if (isSubTask) {
        subTaskStore.updateSubTask(currentItem.id, updates);
      } else {
        taskStore.updateTask(currentItem.id, updates);
      }
    }
  }

  function handleFormChange() {
    console.log('[TaskDetailLogic] handleFormChange called, stack:', new Error().stack);
    debouncedSave();
  }

  function handleTitleChange(title: string) {
    editForm.title = title;
    handleFormChange();
  }

  function handleDescriptionChange(description: string) {
    editForm.description = description;
    handleFormChange();
  }

  function handlePriorityChange(priority: number) {
    editForm.priority = priority;
  }

  // Status handling
  function handleStatusChange(event: Event) {
    if (!currentItem) return;
    const target = event.target as HTMLSelectElement;

    if (isNewTaskMode) {
      taskStore.updateNewTaskData({ status: target.value as TaskStatus });
    } else if (isSubTask) {
      TaskService.changeSubTaskStatus(currentItem.id, target.value as TaskStatus);
    } else {
      TaskService.changeTaskStatus(currentItem.id, target.value as TaskStatus);
    }
  }

  // Date handling
  function handleDueDateClick(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    const rect = event?.target
      ? (event.target as HTMLElement).getBoundingClientRect()
      : { left: 0, bottom: 0 };
    datePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };
    showDatePicker = true;
  }

  async function handleDateChange(data: {
    date: string;
    dateTime: string;
    range?: { start: string; end: string };
    isRangeDate: boolean;
    recurrenceRule?: LegacyRecurrenceRule | null;
  }) {
    const { dateTime, range, isRangeDate: isRange, recurrenceRule } = data;

    if (isRange) {
      if (range) {
        editForm = {
          ...editForm,
          plan_start_date: new SvelteDate(range.start),
          plan_end_date: new SvelteDate(range.end),
          is_range_date: true
        };
      } else {
        const currentEndDate = editForm.plan_end_date || new SvelteDate(dateTime);
        editForm = {
          ...editForm,
          plan_start_date: currentEndDate,
          plan_end_date: currentEndDate,
          is_range_date: true
        };
      }
    } else {
      editForm = {
        ...editForm,
        plan_end_date: new SvelteDate(dateTime),
        plan_start_date: undefined,
        is_range_date: false
      };
    }

    // recurrenceRuleが渡された場合、editFormを更新してバックエンドに保存
    if (recurrenceRule !== undefined) {
      editForm = {
        ...editForm,
        recurrenceRule: fromLegacyRecurrenceRule(recurrenceRule)
      };

      // 繰り返しルール変更をバックエンドに保存
      await handleRecurrenceChange(recurrenceRule);
    }

    // 日付変更は即座に保存してタスク一覧に反映させる
    saveImmediately();
  }

  function handleDateClear() {
    editForm = {
      ...editForm,
      plan_start_date: undefined,
      plan_end_date: undefined,
      is_range_date: false
    };
    // 日付クリアも即座に保存してタスク一覧に反映させる
    saveImmediately();
  }

  function handleDatePickerClose() {
    showDatePicker = false;
  }

  // Task actions
  function handleDelete() {
    if (!currentItem) return;
    if (isNewTaskMode) {
      taskStore.cancelNewTaskMode();
      return;
    }

    const current = currentItem; // Type guard to satisfy TypeScript

    if (isSubTask) {
      deleteDialogTitle = translationService.getMessage('delete_subtask_title')();
      deleteDialogMessage = translationService.getMessage('delete_subtask_message')();
      pendingDeleteAction = () => TaskService.deleteSubTask(current.id);
    } else {
      deleteDialogTitle = translationService.getMessage('delete_task_title')();
      deleteDialogMessage = translationService.getMessage('delete_task_message')();
      pendingDeleteAction = () => TaskService.deleteTask(current.id);
    }

    showDeleteDialog = true;
  }

  async function handleSaveNewTask() {
    if (!isNewTaskMode) return;
    const newTaskId = await taskStore.saveNewTask();
    if (newTaskId) {
      TaskService.selectTask(newTaskId);
    }
  }

  function handleSubTaskToggle(subTaskId: string) {
    if (!task) return;
    TaskService.toggleSubTaskStatus(task, subTaskId);
  }

  function handleSubTaskClick(subTaskId: string) {
    TaskService.selectSubTask(subTaskId);
  }

  function handleAddSubTask() {
    showSubTaskAddForm = !showSubTaskAddForm;
  }

  async function handleSubTaskAdded(title: string) {
    if (!task || !title.trim()) return;

    const newSubTask = await TaskService.addSubTask(task.id, {
      title: title.trim()
    });

    if (newSubTask) {
      showSubTaskAddForm = false;
      // サブタスクは連続入力することが多いため、自動選択はしない
      // タスク詳細画面は現在のメインタスクを維持
    }
  }

  function handleSubTaskAddCancel() {
    showSubTaskAddForm = false;
  }

  function handleGoToParentTask() {
    if (isSubTask && currentItem && 'taskId' in currentItem) {
      TaskService.selectTask(currentItem.taskId);
    }
  }

  // Project/TaskList handling
  function handleProjectTaskListEdit() {
    showProjectTaskListDialog = true;
  }

  async function handleProjectTaskListChange(data: { projectId: string; taskListId: string }) {
    if (!currentItem || isNewTaskMode) return;

    if (isSubTask) {
      if ('taskId' in currentItem) {
        await taskStore.moveTaskToList(currentItem.taskId, data.taskListId);
      }
    } else {
      await taskStore.moveTaskToList(currentItem.id, data.taskListId);
    }
    showProjectTaskListDialog = false;
  }

  function handleProjectTaskListDialogClose() {
    showProjectTaskListDialog = false;
  }

  // Confirmation handling
  function showConfirmationIfNeeded(action: () => void): boolean {
    if (isNewTaskMode && editForm.title.trim()) {
      pendingAction = action;
      showConfirmationDialog = true;
      return false;
    }
    action();
    return true;
  }

  function handleConfirmDiscard() {
    showConfirmationDialog = false;
    if (pendingAction) {
      pendingAction();
      pendingAction = null;
    }
  }

  function handleCancelDiscard() {
    showConfirmationDialog = false;
    pendingAction = null;
    taskStore.clearPendingSelections();
  }

  function handleConfirmDelete() {
    showDeleteDialog = false;
    if (pendingDeleteAction) {
      pendingDeleteAction();
      pendingDeleteAction = null;
    }
  }

  function handleCancelDelete() {
    showDeleteDialog = false;
    pendingDeleteAction = null;
  }

  // Recurrence handling
  async function handleRecurrenceChange(rule: LegacyRecurrenceRule | null) {
    if (!currentItem || isNewTaskMode) {
      return;
    }

    // タスク/サブタスクからprojectIdを取得
    const projectId = isSubTask && 'taskId' in currentItem
      ? taskStore.getTaskProjectAndList(currentItem.taskId)?.project.id
      : taskStore.getTaskProjectAndList(currentItem.id)?.project.id;

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
        if (isSubTask) {
          await backend.subtaskRecurrence.delete(projectId, currentItem.id);
        } else {
          await backend.taskRecurrence.delete(projectId, currentItem.id);
        }
      } else {
        // 既存の繰り返し関連付けを確認
        const existing = isSubTask
          ? await backend.subtaskRecurrence.getBySubtaskId(projectId, currentItem.id)
          : await backend.taskRecurrence.getByTaskId(projectId, currentItem.id);

        if (existing) {
          // 既存のRecurrenceRuleを更新
          await backend.recurrenceRule.update(projectId, { ...unifiedRule!, id: existing.recurrenceRuleId });
        } else {
          // 新規RecurrenceRuleを作成
          const ruleId = crypto.randomUUID();
          await backend.recurrenceRule.create(projectId, { ...unifiedRule!, id: ruleId });

          // 関連付けを作成
          if (isSubTask) {
            await backend.subtaskRecurrence.create(projectId, {
              subtaskId: currentItem.id,
              recurrenceRuleId: ruleId
            });
          } else {
            await backend.taskRecurrence.create(projectId, {
              taskId: currentItem.id,
              recurrenceRuleId: ruleId
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to save recurrence rule:', error);
      // Note: editFormは更新していないため、ロールバック処理は不要
    }

    showRecurrenceDialog = false;
  }

  function handleRecurrenceDialogClose(open?: boolean) {
    // openパラメータが渡された場合（onOpenChangeから呼ばれた場合）
    if (typeof open === 'boolean') {
      showRecurrenceDialog = open;
    } else {
      // 直接呼ばれた場合（従来の動作）
      showRecurrenceDialog = false;
    }
  }

  // Watch for pending selections from taskStore
  $effect(() => {
    if (taskStore.pendingTaskSelection) {
      const taskId = taskStore.pendingTaskSelection;
      showConfirmationIfNeeded(() => {
        TaskService.forceSelectTask(taskId);
        taskStore.clearPendingSelections();
      });
    }
  });

  $effect(() => {
    if (taskStore.pendingSubTaskSelection) {
      const subTaskId = taskStore.pendingSubTaskSelection;
      showConfirmationIfNeeded(() => {
        TaskService.forceSelectSubTask(subTaskId);
        taskStore.clearPendingSelections();
      });
    }
  });

  // Sync form with current item
  let lastSyncedItemId = $state<string | undefined>(undefined);

  $effect(() => {
    const itemId = currentItem?.id;
    // Only sync when the item actually changes (not on every reactive update)
    if (currentItem && itemId !== lastSyncedItemId) {
      lastSyncedItemId = itemId;
      editForm = {
        title: currentItem.title,
        description: currentItem.description || '',
        plan_start_date: currentItem.planStartDate,
        plan_end_date: currentItem.planEndDate,
        is_range_date: currentItem.isRangeDate || false,
        priority: currentItem.priority || 0,
        recurrenceRule: fromLegacyRecurrenceRule(currentItem.recurrenceRule)
      };
    } else if (!currentItem) {
      lastSyncedItemId = undefined;
    }
  });
</script>

{#if isDrawerMode}
  <!-- Drawer mode: no Card wrapper, direct content -->
  <div class="flex h-full flex-col">
    <TaskDetailContent
      {currentItem}
      {task}
      {subTask}
      {isSubTask}
      {isNewTaskMode}
      {editForm}
      selectedSubTaskId={taskStore.selectedSubTaskId}
      projectInfo={getProjectInfo()}
      {isDrawerMode}
      onTitleChange={handleTitleChange}
      onDescriptionChange={handleDescriptionChange}
      onPriorityChange={handlePriorityChange}
      onStatusChange={handleStatusChange}
      onDueDateClick={handleDueDateClick}
      onFormChange={handleFormChange}
      onDelete={handleDelete}
      onSaveNewTask={handleSaveNewTask}
      onSubTaskClick={handleSubTaskClick}
      onSubTaskToggle={handleSubTaskToggle}
      onAddSubTask={handleAddSubTask}
      {showSubTaskAddForm}
      onSubTaskAdded={handleSubTaskAdded}
      onSubTaskAddCancel={handleSubTaskAddCancel}
      onGoToParentTask={handleGoToParentTask}
      onProjectTaskListEdit={handleProjectTaskListEdit}
    />
  </div>
{:else}
  <!-- Desktop mode: Card wrapper -->
  <Card class="flex h-full flex-col">
    <TaskDetailContent
      {currentItem}
      {task}
      {subTask}
      {isSubTask}
      {isNewTaskMode}
      {editForm}
      selectedSubTaskId={taskStore.selectedSubTaskId}
      projectInfo={getProjectInfo()}
      {isDrawerMode}
      onTitleChange={handleTitleChange}
      onDescriptionChange={handleDescriptionChange}
      onPriorityChange={handlePriorityChange}
      onStatusChange={handleStatusChange}
      onDueDateClick={handleDueDateClick}
      onFormChange={handleFormChange}
      onDelete={handleDelete}
      onSaveNewTask={handleSaveNewTask}
      onSubTaskClick={handleSubTaskClick}
      onSubTaskToggle={handleSubTaskToggle}
      onAddSubTask={handleAddSubTask}
      {showSubTaskAddForm}
      onSubTaskAdded={handleSubTaskAdded}
      onSubTaskAddCancel={handleSubTaskAddCancel}
      onGoToParentTask={handleGoToParentTask}
      onProjectTaskListEdit={handleProjectTaskListEdit}
    />
  </Card>
{/if}

<!-- All Dialogs -->
<TaskDetailDialogs
  {currentItem}
  editForm={editFormForUI}
  {showDatePicker}
  {datePickerPosition}
  {showConfirmationDialog}
  {showDeleteDialog}
  {deleteDialogTitle}
  {deleteDialogMessage}
  {showProjectTaskListDialog}
  {showRecurrenceDialog}
  projectInfo={getProjectInfo()}
  onDateChange={handleDateChange}
  onDateClear={handleDateClear}
  onDatePickerClose={handleDatePickerClose}
  onConfirmDiscard={handleConfirmDiscard}
  onCancelDiscard={handleCancelDiscard}
  onConfirmDelete={handleConfirmDelete}
  onCancelDelete={handleCancelDelete}
  onProjectTaskListChange={handleProjectTaskListChange}
  onProjectTaskListDialogClose={handleProjectTaskListDialogClose}
  onRecurrenceChange={handleRecurrenceChange}
  onRecurrenceDialogClose={handleRecurrenceDialogClose}
/>
