<script lang="ts">
  import * as Command from '$lib/components/ui/command/index.js';
  import type { TaskWithSubTasks } from '$lib/types/task';

  interface Props {
    task: TaskWithSubTasks;
    isTagSearch: boolean;
    onSelect: () => void;
  }

  let { task, isTagSearch, onSelect }: Props = $props();
</script>

<Command.Item {onSelect}>
  <span class="truncate font-medium">{task.title}</span>
  {#if isTagSearch && task.tags.length > 0}
    <div class="ml-2 flex gap-1">
      {#each task.tags as tag (tag.id)}
        <span
          class="bg-secondary text-secondary-foreground inline-flex items-center rounded px-1.5 py-0.5 text-xs"
        >
          #{tag.name}
        </span>
      {/each}
    </div>
  {:else if task.description}
    <span class="text-muted-foreground ml-2 truncate text-xs">
      {task.description}
    </span>
  {/if}
</Command.Item>