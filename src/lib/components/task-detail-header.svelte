<script lang="ts">
  import type { TaskWithSubTasks, SubTask } from '$lib/types/task';
  import Button from '$lib/components/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { Trash2 } from 'lucide-svelte';
  import { localeStore, reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

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

  // Reactive messages
  const delete_task = reactiveMessage(m.delete_task);
  const sub_task = reactiveMessage(m.sub_task);
  const sub_task_title = reactiveMessage(m.sub_task_title);
  const task_title = reactiveMessage(m.task_title);


</script>

<div class="p-6 border-b">
  <div class="flex items-start justify-between">
    <div class="flex-1">
      {#if isSubTask}
        <div class="text-sm text-muted-foreground mb-1">{sub_task()}</div>
      {/if}
      <Input
        type="text"
        class="w-full text-xl font-semibold border-none shadow-none px-0 focus-visible:ring-0"
        value={title}
        oninput={handleTitleInput}
        placeholder={isSubTask ? sub_task_title() : task_title()}
      />
    </div>
    <div class="flex gap-2 ml-4">
      <Button variant="ghost" size="icon" class="text-destructive" onclick={onDelete} title={delete_task()}>
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
