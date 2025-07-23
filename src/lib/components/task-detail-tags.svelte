<script lang="ts">
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import type { TaskWithSubTasks } from '$lib/types/task';
  import * as m from '$paraglide/messages';
  import type { Props } from './ui/button';

  interface Props {
    task: TaskWithSubTasks;
  }


  let { task }: Props = $props();

  // Reactive messages
  const tags = reactiveMessage(m.tags);

</script>

{#if task.tags.length > 0}
  <div>
    <h3 class="block text-sm font-medium mb-2">{tags()}</h3>
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
