<script lang="ts">
  import { taskStore } from '$lib/stores/tasks.svelte';
  import type { TaskWithSubTasks, TaskStatus } from '$lib/types/task';
  import { formatDetailedDate, formatDateTime, formatDateForInput } from '$lib/utils/date-utils';
  import { getStatusLabel, getPriorityLabel, getPriorityColorClass } from '$lib/utils/task-utils';
  import { TaskService } from '$lib/services/task-service';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Textarea from '$lib/components/ui/textarea.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { Trash2 } from 'lucide-svelte';
  import Card from '$lib/components/ui/card.svelte';

  let task = $derived(taskStore.selectedTask);
  let editForm = $state({
    title: '',
    description: '',
    due_date: '',
    priority: 0
  });
  let saveTimeout: number | null = null;

  $effect(() => {
    if (task) {
      editForm = {
        title: task.title,
        description: task.description || '',
        due_date: formatDateForInput(task.due_date),
        priority: task.priority
      };
    }
  });

  function debouncedSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      if (task) {
        TaskService.updateTaskFromForm(task.id, editForm);
      }
    }, 500); // 500ms delay
  }

  function handleFormChange() {
    debouncedSave();
  }


  function handleStatusChange(event: Event) {
    if (!task) return;
    const target = event.target as HTMLSelectElement;
    TaskService.changeTaskStatus(task.id, target.value as TaskStatus);
  }

  function handleDelete() {
    if (!task) return;
    TaskService.deleteTask(task.id);
  }

  function handleSubTaskToggle(subTaskId: string) {
    if (!task) return;
    TaskService.toggleSubTaskStatus(task, subTaskId);
  }
</script>

<Card class="flex flex-col h-full">
  {#if task}
    <!-- Header -->
    <div class="p-6 border-b">
      <div class="flex items-start justify-between">
        <Input
          type="text"
          class="w-full text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
          bind:value={editForm.title}
          placeholder="Task title"
          oninput={handleFormChange}
        />
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
            value={task.status}
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
          <label for="task-due-date" class="block text-sm font-medium mb-2">Due Date</label>
          <Input
            id="task-due-date"
            type="date"
            bind:value={editForm.due_date}
            onchange={handleFormChange}
            class="w-full"
          />
        </div>

        <div class="min-w-[120px] flex-1">
          <label for="task-priority" class="block text-sm font-medium mb-2">Priority</label>
          <Select id="task-priority" bind:value={editForm.priority} onchange={handleFormChange} class="w-full">
            <option value={1}>High (1)</option>
            <option value={2}>Medium (2)</option>
            <option value={3}>Low (3)</option>
            <option value={4}>Lowest (4)</option>
          </Select>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label for="task-description" class="block text-sm font-medium mb-2">Description</label>
        <Textarea
          id="task-description"
          class="w-full min-h-24"
          bind:value={editForm.description}
          placeholder="Task description"
          oninput={handleFormChange}
        />
      </div>

      <!-- Sub-tasks -->
      {#if task.sub_tasks.length > 0}
        <div>
          <h3 class="block text-sm font-medium mb-2">Sub-tasks</h3>
          <div class="space-y-2">
            {#each task.sub_tasks as subTask}
              <div class="flex items-center gap-3 p-3 border rounded">
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-lg h-8 w-8"
                  onclick={() => handleSubTaskToggle(subTask.id)}
                  aria-label="Toggle subtask completion"
                >
                  {subTask.status === 'completed' ? '✅' : '⚪'}
                </Button>
                <span
                  class="flex-1"
                  class:line-through={subTask.status === 'completed'}
                  class:text-muted-foreground={subTask.status === 'completed'}
                >
                  {subTask.title}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Tags -->
      {#if task.tags.length > 0}
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
        <div>Created: {formatDateTime(task.created_at)}</div>
        <div>Updated: {formatDateTime(task.updated_at)}</div>
        <div>Task ID: {task.id}</div>
      </div>
    </div>
  {:else}
    <!-- No task selected -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center text-muted-foreground">
        <div class="text-6xl mb-4">📝</div>
        <h2 class="text-xl font-semibold mb-2">No task selected</h2>
        <p>Select a task from the list to view its details</p>
      </div>
    </div>
  {/if}
</Card>
