<script lang="ts">
  import type { TaskWithSubTasks } from '$lib/types/task';

  interface Props {
    task: TaskWithSubTasks;
  }

  let { task }: Props = $props();
</script>

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