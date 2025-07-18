<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks, TaskStatus, SubTask } from '$lib/types/task';
  import { formatDetailedDate, formatDateTime, formatDateForInput, formatDate } from '$lib/utils/date-utils';
  import { getStatusLabel, getPriorityLabel, getPriorityColorClass } from '$lib/utils/task-utils';
  import { TaskService } from '$lib/services/task-service';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { Trash2 } from 'lucide-svelte';
  import Card from '$lib/components/ui/card.svelte';

  let task = $derived(taskStore.selectedTask);
  let subTask = $derived(taskStore.selectedSubTask);
  let currentItem = $derived(task || subTask);
  let isSubTask = $derived(!!subTask);
  
  let editForm = $state({
    title: '',
    description: '',
    due_date: '',
    priority: 0
  });
  let saveTimeout: number | null = null;

  $effect(() => {
    if (currentItem) {
      editForm = {
        title: currentItem.title,
        description: currentItem.description || '',
        due_date: formatDateForInput(currentItem.due_date),
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
        if (isSubTask) {
          TaskService.updateSubTaskFromForm(currentItem.id, editForm);
        } else {
          TaskService.updateTaskFromForm(currentItem.id, editForm);
        }
      }
    }, 500); // 500ms delay
  }

  function handleFormChange() {
    debouncedSave();
  }


  function handleStatusChange(event: Event) {
    if (!currentItem) return;
    const target = event.target as HTMLSelectElement;
    if (isSubTask) {
      TaskService.changeSubTaskStatus(currentItem.id, target.value as TaskStatus);
    } else {
      TaskService.changeTaskStatus(currentItem.id, target.value as TaskStatus);
    }
  }

  function handleDelete() {
    if (!currentItem) return;
    if (isSubTask) {
      TaskService.deleteSubTask(currentItem.id);
    } else {
      TaskService.deleteTask(currentItem.id);
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
    if (isSubTask && currentItem) {
      TaskService.selectTask(currentItem.task_id);
    }
  }
</script>

<Card class="flex flex-col h-full">
  {#if currentItem}
    <!-- Header -->
    <div class="p-6 border-b">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          {#if isSubTask}
            <div class="text-sm text-muted-foreground mb-1">Sub-task</div>
          {/if}
          <Input
            type="text"
            class="w-full text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
            bind:value={editForm.title}
            placeholder={isSubTask ? "Sub-task title" : "Task title"}
            oninput={handleFormChange}
          />
        </div>
        <div class="flex gap-2 ml-4">
          <Button variant="ghost" size="icon" class="text-destructive" onclick={handleDelete} title="Delete">
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6 space-y-6">
      <!-- Status, Due Date, Priority -->
      <div class="flex flex-wrap gap-4">
        <div class="min-w-[120px] flex-1">
          <label for="task-status" class="block text-sm font-medium mb-2">Status</label>
          <Select
            id="task-status"
            value={currentItem.status}
            onchange={handleStatusChange}
            class="w-full"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div class="min-w-[140px] flex-1">
          <label for="task-due-date" class="block text-sm font-medium mb-2">
            Due Date {#if isSubTask}<span class="text-xs text-muted-foreground">(Optional)</span>{/if}
          </label>
          <Input
            id="task-due-date"
            type="date"
            bind:value={editForm.due_date}
            onchange={handleFormChange}
            class="w-full"
          />
        </div>

        <div class="min-w-[120px] flex-1">
          <label for="task-priority" class="block text-sm font-medium mb-2">
            Priority {#if isSubTask}<span class="text-xs text-muted-foreground">(Optional)</span>{/if}
          </label>
          <Select id="task-priority" bind:value={editForm.priority} onchange={handleFormChange} class="w-full">
            {#if isSubTask}
              <option value={0}>Not Set</option>
            {/if}
            <option value={1}>High (1)</option>
            <option value={2}>Medium (2)</option>
            <option value={3}>Low (3)</option>
            <option value={4}>Lowest (4)</option>
          </Select>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label for="task-description" class="block text-sm font-medium mb-2">
          Description {#if isSubTask}<span class="text-xs text-muted-foreground">(Optional)</span>{/if}
        </label>
        <Textarea
          id="task-description"
          class="w-full min-h-24"
          bind:value={editForm.description}
          placeholder={isSubTask ? "Sub-task description (optional)" : "Task description"}
          oninput={handleFormChange}
        />
      </div>

      <!-- Sub-tasks (only show for main tasks, not for sub-tasks) -->
      {#if !isSubTask && task && task.sub_tasks.length > 0}
        <div>
          <h3 class="block text-sm font-medium mb-2">Sub-tasks</h3>
          <div class="space-y-2">
            {#each task.sub_tasks as subTask}
              <Button
                variant="ghost"
                class="flex items-center gap-3 p-3 border rounded w-full justify-start h-auto {taskStore.selectedSubTaskId === subTask.id ? 'bg-primary/10 border-primary' : ''}"
                onclick={() => handleSubTaskClick(subTask.id)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-lg h-8 w-8"
                  onclick={(e) => {
                    e.stopPropagation();
                    handleSubTaskToggle(subTask.id);
                  }}
                  aria-label="Toggle subtask completion"
                >
                  {subTask.status === 'completed' ? '✅' : '⚪'}
                </Button>
                <div class="flex items-center justify-between gap-2 flex-1 min-w-0">
                  <span
                    class="font-medium truncate"
                    class:line-through={subTask.status === 'completed'}
                    class:text-muted-foreground={subTask.status === 'completed'}
                  >
                    {subTask.title}
                  </span>
                  {#if subTask.due_date}
                    <span class="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(subTask.due_date)}
                    </span>
                  {/if}
                </div>
              </Button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Tags (only for main tasks) -->
      {#if !isSubTask && task && task.tags.length > 0}
        <div>
          <h3 class="block text-sm font-medium mb-2">Tags</h3>
          <div class="flex flex-wrap gap-2">
            {#each task.tags as tag}
              <span
                class="px-3 py-1 rounded-full text-sm border"
                style="border-color: {tag.color}; color: {tag.color};"
              >
                {tag.name}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Metadata -->
      <div class="border-t pt-4 space-y-2 text-sm text-muted-foreground">
        <div>Created: {formatDateTime(currentItem.created_at)}</div>
        <div>Updated: {formatDateTime(currentItem.updated_at)}</div>
        <div>{isSubTask ? 'Sub-task' : 'Task'} ID: {currentItem.id}</div>
        {#if isSubTask}
          <div>Parent Task ID: {currentItem.task_id}</div>
          <Button
            variant="outline"
            size="sm"
            onclick={() => handleGoToParentTask()}
            class="mt-2"
          >
            Go to Parent Task
          </Button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- No task or subtask selected -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center text-muted-foreground">
        <div class="text-6xl mb-4">📝</div>
        <h2 class="text-xl font-semibold mb-2">No task selected</h2>
        <p>Select a task or sub-task from the list to view its details</p>
      </div>
    </div>
  {/if}
</Card>
