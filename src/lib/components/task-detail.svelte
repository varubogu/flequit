<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks, TaskStatus, SubTask, RecurrenceRule } from '$lib/types/task';
  import { TaskService } from '$lib/services/task-service';
  import Card from '$lib/components/ui/card.svelte';
  import InlineDatePicker from '$lib/components/inline-date-picker.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages.js';
  import TaskDetailHeader from './task-detail-header.svelte';
  import TaskStatusSelector from './task-status-selector.svelte';
  import TaskDueDateSelector from './task-due-date-selector.svelte';
  import TaskPrioritySelector from './task-priority-selector.svelte';
  import TaskDescriptionEditor from './task-description-editor.svelte';
  import TaskDetailSubTasks from './task-detail-subtasks.svelte';
  import TaskDetailTags from './task-detail-tags.svelte';
  import TaskDetailMetadata from './task-detail-metadata.svelte';
  import TaskDetailEmptyState from './task-detail-empty-state.svelte';
  import NewTaskConfirmationDialog from './new-task-confirmation-dialog.svelte';
  import DeleteConfirmationDialog from './delete-confirmation-dialog.svelte';
  import ProjectTaskListSelector from './project-task-list-selector.svelte';
  import ProjectTaskListSelectorDialog from './project-task-list-selector-dialog.svelte';
  import RecurrenceDialogAdvanced from './recurrence-dialog-advanced.svelte';
  import TaskRecurrenceSelector from './task-recurrence-selector.svelte';

  let task = $derived(taskStore.selectedTask);
  let subTask = $derived(taskStore.selectedSubTask);
  let currentItem = $derived(task || subTask || (taskStore.isNewTaskMode ? taskStore.newTaskData : null));
  let isSubTask = $derived(!!subTask);
  let isNewTaskMode = $derived(taskStore.isNewTaskMode);
  
  let editForm = $state({
    title: '',
    description: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    is_range_date: false,
    priority: 0
  });
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Date picker state
  let showDatePicker = $state(false);
  let datePickerPosition = $state({ x: 0, y: 0 });
  
  // Confirmation dialog state
  let showConfirmationDialog = $state(false);
  let pendingAction = $state<(() => void) | null>(null);
  
  // Delete confirmation dialog state
  let showDeleteDialog = $state(false);
  let deleteDialogTitle = $state('');
  let deleteDialogMessage = $state('');
  let pendingDeleteAction = $state<(() => void) | null>(null);
  
  // Project task list selector dialog state
  let showProjectTaskListDialog = $state(false);
  
  // Recurrence dialog state
  let showRecurrenceDialog = $state(false);
  
  // プロジェクト・タスクリスト情報の取得
  let projectInfo = $derived(() => {
    if (isNewTaskMode || !currentItem) return null;
    if (isSubTask && 'task_id' in currentItem) {
      // サブタスクの場合は親タスクの情報を取得
      return taskStore.getTaskProjectAndList(currentItem.task_id);
    } else {
      return taskStore.getTaskProjectAndList(currentItem.id);
    }
  });
  
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

  $effect(() => {
    if (currentItem) {
      editForm = {
        title: currentItem.title,
        description: currentItem.description || '',
        start_date: currentItem.start_date,
        end_date: currentItem.end_date,
        is_range_date: currentItem.is_range_date || false,
        priority: currentItem.priority || 0
      };
    }
  });

  function debouncedSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      if (currentItem) {
        // Use the same update method as task-item for consistency
        const updates: any = {
          title: editForm.title,
          description: editForm.description || undefined,
          priority: editForm.priority,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          is_range_date: editForm.is_range_date
        };
        
        if (isNewTaskMode) {
          taskStore.updateNewTaskData(updates);
        } else if (isSubTask) {
          taskStore.updateSubTask(currentItem.id, updates);
        } else {
          taskStore.updateTask(currentItem.id, updates);
        }
      }
    }, 500); // 500ms delay
  }

  function handleFormChange() {
    debouncedSave();
  }

  // Date picker handlers
  function handleDueDateClick(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    
    const rect = event?.target ? (event.target as HTMLElement).getBoundingClientRect() : { left: 0, bottom: 0 };
    datePickerPosition = {
      x: Math.min(rect.left, window.innerWidth - 300),
      y: rect.bottom + 8
    };
    showDatePicker = true;
  }

  function handleDateChange(data: { date: string; dateTime: string; range?: { start: string; end: string }; isRangeDate: boolean }) {
    const { dateTime, range, isRangeDate } = data;
    
    if (isRangeDate) {
      if (range) {
        // Range mode with both start and end dates
        editForm = {
          ...editForm,
          start_date: new Date(range.start),
          end_date: new Date(range.end),
          is_range_date: true
        };
      } else {
        // Range mode switched on, but no range data yet - keep current end_date as both start and end
        const currentEndDate = editForm.end_date || new Date(dateTime);
        editForm = {
          ...editForm,
          start_date: currentEndDate,
          end_date: currentEndDate,
          is_range_date: true
        };
      }
    } else {
      // Single mode
      editForm = {
        ...editForm,
        end_date: new Date(dateTime),
        start_date: undefined,
        is_range_date: false
      };
    }
    
    debouncedSave();
  }

  function handleDateClear() {
    editForm = {
      ...editForm,
      start_date: undefined,
      end_date: undefined,
      is_range_date: false
    };
    debouncedSave();
  }

  function handleDatePickerClose() {
    showDatePicker = false;
  }


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

  function handleDelete() {
    if (!currentItem) return;
    if (isNewTaskMode) {
      taskStore.cancelNewTaskMode();
      return;
    }
    
    // Show delete confirmation dialog
    if (isSubTask) {
      deleteDialogTitle = reactiveMessage(m.delete_subtask_title)();
      deleteDialogMessage = reactiveMessage(m.delete_subtask_message)();
      pendingDeleteAction = () => TaskService.deleteSubTask(currentItem.id);
    } else {
      deleteDialogTitle = reactiveMessage(m.delete_task_title)();
      deleteDialogMessage = reactiveMessage(m.delete_task_message)();
      pendingDeleteAction = () => TaskService.deleteTask(currentItem.id);
    }
    
    showDeleteDialog = true;
  }

  function handleSaveNewTask() {
    if (!isNewTaskMode) return;
    const newTaskId = taskStore.saveNewTask();
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
  
  function handleGoToParentTask() {
    if (isSubTask && currentItem && 'task_id' in currentItem) {
      TaskService.selectTask(currentItem.task_id);
    }
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

  function handleProjectTaskListEdit() {
    showProjectTaskListDialog = true;
  }

  function handleProjectTaskListChange(data: { projectId: string; taskListId: string }) {
    if (!currentItem || isNewTaskMode) return;
    
    // タスクを新しいタスクリストに移動
    if (isSubTask) {
      // サブタスクの場合は親タスクを移動
      if ('task_id' in currentItem) {
        taskStore.moveTaskToList(currentItem.task_id, data.taskListId);
      }
    } else {
      taskStore.moveTaskToList(currentItem.id, data.taskListId);
    }
    showProjectTaskListDialog = false;
  }

  function handleProjectTaskListDialogClose() {
    showProjectTaskListDialog = false;
  }
  
  // Confirmation dialog handlers
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
  
  // Delete confirmation dialog handlers
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
  
  // Recurrence dialog handlers
  function handleRecurrenceEdit() {
    showRecurrenceDialog = true;
  }
  
  function handleRecurrenceChange(rule: RecurrenceRule | null) {
    if (!currentItem || isNewTaskMode) return;
    
    const updates = { recurrence_rule: rule || undefined };
    
    if (isSubTask) {
      taskStore.updateSubTask(currentItem.id, updates);
    } else {
      taskStore.updateTask(currentItem.id, updates);
    }
    
    showRecurrenceDialog = false;
  }
  
  function handleRecurrenceDialogClose() {
    showRecurrenceDialog = false;
  }
</script>

<Card class="flex flex-col h-full">
  {#if currentItem}
    <TaskDetailHeader 
      {currentItem}
      {isSubTask}
      {isNewTaskMode}
      title={editForm.title}
      onTitleChange={handleTitleChange}
      onDelete={handleDelete}
      onSaveNewTask={handleSaveNewTask}
    />

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6 space-y-6">
      <!-- Status, Due Date, Priority -->
      <div class="flex flex-wrap gap-4">
        <TaskStatusSelector
          {currentItem}
          onStatusChange={handleStatusChange}
        />

        <TaskDueDateSelector
          {currentItem}
          {isSubTask}
          formData={editForm}
          onDueDateClick={handleDueDateClick}
        />

        <TaskPrioritySelector
          {isSubTask}
          formData={editForm}
          onPriorityChange={handlePriorityChange}
          onFormChange={handleFormChange}
        />

        <!-- 繰り返し設定（新規タスクモード以外かつサブタスク以外） -->
        {#if !isNewTaskMode && !isSubTask}
          <TaskRecurrenceSelector
            recurrenceRule={currentItem?.recurrence_rule}
            onEdit={handleRecurrenceEdit}
          />
        {/if}
      </div>

      <!-- Description -->
      <TaskDescriptionEditor
        {currentItem}
        {isSubTask}
        {isNewTaskMode}
        formData={editForm}
        onDescriptionChange={handleDescriptionChange}
      />

      <!-- Sub-tasks (only show for main tasks, not for sub-tasks or new task mode) -->
      {#if !isSubTask && !isNewTaskMode && task}
        <TaskDetailSubTasks 
          {task}
          selectedSubTaskId={taskStore.selectedSubTaskId}
          onSubTaskClick={handleSubTaskClick}
          onSubTaskToggle={handleSubTaskToggle}
        />
      {/if}

      <!-- Tags -->
      {#if task || subTask || (isNewTaskMode && currentItem)}
        <TaskDetailTags 
          task={isSubTask ? null : task} 
          subTask={isSubTask ? subTask : null}
          {isNewTaskMode} 
        />
      {/if}

      <!-- プロジェクト・タスクリスト表示（新規タスクモード以外） -->
      {#if !isNewTaskMode}
        <ProjectTaskListSelector 
          projectInfo={projectInfo()} 
          onEdit={handleProjectTaskListEdit}
        />
      {/if}

      <TaskDetailMetadata 
        {currentItem}
        {isSubTask}
        {isNewTaskMode}
        onGoToParentTask={handleGoToParentTask}
      />
    </div>
  {:else}
    <TaskDetailEmptyState />
  {/if}
</Card>

<!-- Inline Date Picker -->
<InlineDatePicker
  show={showDatePicker}
  currentDate={currentItem?.end_date ? currentItem.end_date.toISOString() : ''}
  currentStartDate={currentItem?.start_date ? currentItem.start_date.toISOString() : ''}
  position={datePickerPosition}
  isRangeDate={editForm.is_range_date}
  recurrenceRule={currentItem?.recurrence_rule}
  onchange={handleDateChange}
  onclear={handleDateClear}
  onclose={handleDatePickerClose}
  onRecurrenceEdit={handleRecurrenceEdit}
/>

<!-- Confirmation dialog for new task mode -->
<NewTaskConfirmationDialog
  open={showConfirmationDialog}
  onConfirm={handleConfirmDiscard}
  onCancel={handleCancelDiscard}
/>

<!-- Delete confirmation dialog -->
<DeleteConfirmationDialog
  open={showDeleteDialog}
  title={deleteDialogTitle}
  message={deleteDialogMessage}
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
/>

<!-- プロジェクト・タスクリスト選択モーダル -->
<ProjectTaskListSelectorDialog
  open={showProjectTaskListDialog}
  currentProjectId={projectInfo()?.project.id || ''}
  currentTaskListId={projectInfo()?.taskList.id || ''}
  onSave={handleProjectTaskListChange}
  onClose={handleProjectTaskListDialogClose}
/>

<!-- 繰り返し設定ダイアログ -->
<RecurrenceDialogAdvanced
  open={showRecurrenceDialog}
  recurrenceRule={currentItem?.recurrence_rule}
  onSave={handleRecurrenceChange}
  onOpenChange={handleRecurrenceDialogClose}
/>
