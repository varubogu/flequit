<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';
  import type { SubTask } from '$lib/types/sub-task';
  import TaskDetailHeader from '$lib/components/task/detail/task-detail-header.svelte';
  import TaskStatusSelector from '$lib/components/task/forms/task-status-selector.svelte';
  import TaskDueDateSelector from '$lib/components/task/forms/task-due-date-selector.svelte';
  import TaskPrioritySelector from '$lib/components/task/forms/task-priority-selector.svelte';
  import TaskDescriptionEditor from '$lib/components/task/editors/task-description-editor.svelte';
  import TaskDetailSubTasks from '$lib/components/task/detail/task-detail-subtasks.svelte';
  import TaskDetailTags from '$lib/components/task/detail/task-detail-tags.svelte';
  import TaskDetailMetadata from '$lib/components/task/detail/task-detail-metadata.svelte';
  import TaskDetailEmptyState from '$lib/components/task/detail/task-detail-empty-state.svelte';
  import ProjectTaskListSelector from '$lib/components/project/project-task-list-selector.svelte';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask | null;
    task: TaskWithSubTasks | null;
    subTask: SubTask | null;
    isSubTask: boolean;
    isNewTaskMode: boolean;
    editForm: {
      title: string;
      description: string;
      plan_start_date: Date | undefined;
      plan_end_date: Date | undefined;
      is_range_date: boolean;
      priority: number;
    };
    selectedSubTaskId: string | null;
    projectInfo: {
      project: { id: string; name: string };
      taskList: { id: string; name: string };
    } | null;
    isDrawerMode?: boolean;
    onTitleChange: (title: string) => void;
    onDescriptionChange: (description: string) => void;
    onPriorityChange: (priority: number) => void;
    onStatusChange: (event: Event) => void;
    onDueDateClick: (event?: Event) => void;
    onFormChange: () => void;
    onDelete: () => void;
    onSaveNewTask: () => Promise<void>;
    onSubTaskClick: (subTaskId: string) => void;
    onSubTaskToggle: (subTaskId: string) => void;
    onAddSubTask?: () => void;
    showSubTaskAddForm?: boolean;
    onSubTaskAdded?: (title: string) => void;
    onSubTaskAddCancel?: () => void;
    onGoToParentTask: () => void;
    onProjectTaskListEdit: () => void;
  }

  let {
    currentItem,
    task,
    subTask,
    isSubTask,
    isNewTaskMode,
    editForm,
    selectedSubTaskId,
    projectInfo,
    isDrawerMode = false,
    onTitleChange,
    onDescriptionChange,
    onPriorityChange,
    onStatusChange,
    onDueDateClick,
    onFormChange,
    onDelete,
    onSaveNewTask,
    onSubTaskClick,
    onSubTaskToggle,
    onAddSubTask,
    showSubTaskAddForm,
    onSubTaskAdded,
    onSubTaskAddCancel,
    onGoToParentTask,
    onProjectTaskListEdit
  }: Props = $props();
</script>

{#if currentItem}
  <TaskDetailHeader
    {currentItem}
    {isSubTask}
    {isNewTaskMode}
    title={editForm.title}
    {onTitleChange}
    {onDelete}
    {onSaveNewTask}
  />

  <!-- Content -->
  <div
    class="flex-1 space-y-{isDrawerMode ? '4' : '6'} overflow-auto {isDrawerMode ? 'py-4' : 'p-6'}"
  >
    <!-- Status, Due Date, Priority -->
    <div class="flex flex-wrap gap-4">
      <TaskStatusSelector {currentItem} {onStatusChange} />

      <TaskDueDateSelector {currentItem} {isSubTask} formData={editForm} {onDueDateClick} />

      <TaskPrioritySelector {isSubTask} formData={editForm} {onPriorityChange} {onFormChange} />
    </div>

    <!-- Description -->
    <TaskDescriptionEditor
      {currentItem}
      {isSubTask}
      {isNewTaskMode}
      formData={editForm}
      {onDescriptionChange}
    />

    <!-- Sub-tasks (only show for main tasks, not for sub-tasks or new task mode) -->
    {#if !isSubTask && !isNewTaskMode && task}
      <TaskDetailSubTasks
        {task}
        {selectedSubTaskId}
        {onSubTaskClick}
        {onSubTaskToggle}
        {onAddSubTask}
        {showSubTaskAddForm}
        {onSubTaskAdded}
        {onSubTaskAddCancel}
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
      <ProjectTaskListSelector {projectInfo} onEdit={onProjectTaskListEdit} />
    {/if}

    <TaskDetailMetadata {currentItem} {isSubTask} {isNewTaskMode} {onGoToParentTask} />
  </div>
{:else}
  <TaskDetailEmptyState />
{/if}
