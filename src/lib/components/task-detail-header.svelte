<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { Trash2 } from 'lucide-svelte';

  interface Props {
    currentItem: TaskWithSubTasks | SubTask;
    isSubTask: boolean;
    title: string;
    onTitleChange: (title: string) => void;
    onDelete: () => void;
  }

  let { currentItem, isSubTask, title, onTitleChange, onDelete }: Props = $props();

  function handleTitleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    onTitleChange(target.value);
  }
</script>

<div class="p-6 border-b">
  <div class="flex items-start justify-between">
    <div class="flex-1">
      {#if isSubTask}
        <div class="text-sm text-muted-foreground mb-1">Sub-task</div>
      {/if}
      <Input
        type="text"
        class="w-full text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
        value={title}
        oninput={handleTitleInput}
        placeholder={isSubTask ? "Sub-task title" : "Task title"}
      />
    </div>
    <div class="flex gap-2 ml-4">
      <Button variant="ghost" size="icon" class="text-destructive" onclick={onDelete} title="Delete">
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>