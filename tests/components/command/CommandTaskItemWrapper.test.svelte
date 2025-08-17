<script lang="ts">
  import * as Command from '$lib/components/ui/command/index.js';
  import CommandTaskItem from '$lib/components/command/command-task-item.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';

  interface Props {
    task: TaskWithSubTasks;
    isTagSearch: boolean;
    onSelect: () => void;
  }

  let { task, isTagSearch, onSelect }: Props = $props();
</script>

<Command.Root>
  <CommandTaskItem {task} {isTagSearch} {onSelect} />
</Command.Root>