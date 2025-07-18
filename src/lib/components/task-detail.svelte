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
  import { Save, X, Edit3, Trash2 } from 'lucide-svelte';
  import Card from '$lib/components/ui/card.svelte';
  
  let task = $derived(taskStore.selectedTask);
  let isEditing = $state(false);
  let editForm = $state({
    title: '',
    description: '',
    due_date: '',
    priority: 0
  });
  
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
  
  function handleEdit() {
    isEditing = true;
  }
  
  function handleSave() {
    if (!task) return;
    TaskService.updateTaskFromForm(task.id, editForm);
    isEditing = false;
  }
  
  function handleCancel() {
    if (task) {
      editForm = {
        title: task.title,
        description: task.description || '',
        due_date: formatDateForInput(task.due_date),
        priority: task.priority
      };
    }
    isEditing = false;
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
      {#if isEditing}
        <div class="space-y-4">
          <Input
            type="text"
            class="w-full text-xl font-semibold"
            bind:value={editForm.title}
            placeholder="Task title"
          />
          <div class="flex gap-2">
            <Button size="icon" onclick={handleSave} title="Save">
              <Save class="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onclick={handleCancel} title="Cancel">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>
      {:else}
        <div class="flex items-start justify-between">
          <h1 class="text-2xl font-bold mb-2">{task.title}</h1>
          <div class="flex gap-2">
            <Button variant="ghost" size="icon" onclick={handleEdit} title="Edit">
              <Edit3 class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" class="text-destructive" onclick={handleDelete} title="Delete">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-auto p-6 space-y-6">
      <!-- Status -->
      <div>
        <label for="task-status" class="block text-sm font-medium mb-2">Status</label>
        <Select 
          id="task-status"
          value={task.status}
          onchange={handleStatusChange}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>
      
      <!-- Description -->
      <div>
        <label for="task-description" class="block text-sm font-medium mb-2">Description</label>
        {#if isEditing}
          <Textarea
            id="task-description"
            class="w-full min-h-24"
            bind:value={editForm.description}
            placeholder="Task description"
          />
        {:else}
          <p class="text-muted-foreground">
            {task.description || 'No description provided'}
          </p>
        {/if}
      </div>
      
      <!-- Due Date -->
      <div>
        <label for="task-due-date" class="block text-sm font-medium mb-2">Due Date</label>
        {#if isEditing}
          <Input
            id="task-due-date"
            type="date"
            bind:value={editForm.due_date}
          />
        {:else}
          <p class="text-muted-foreground">{formatDetailedDate(task.due_date)}</p>
        {/if}
      </div>
      
      <!-- Priority -->
      <div>
        <label for="task-priority" class="block text-sm font-medium mb-2">Priority</label>
        {#if isEditing}
          <Select id="task-priority" bind:value={editForm.priority}>
            <option value={1}>High (1)</option>
            <option value={2}>Medium (2)</option>
            <option value={3}>Low (3)</option>
            <option value={4}>Lowest (4)</option>
          </Select>
        {:else}
          <span class="px-2 py-1 rounded text-sm {getPriorityColorClass(task.priority)}">
            {getPriorityLabel(task.priority)} ({task.priority})
          </span>
        {/if}
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