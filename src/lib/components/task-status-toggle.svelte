<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { getStatusIcon } from '$lib/utils/task-utils';
  import type { TaskStatus } from '$lib/types/task';

  interface Props {
    status: TaskStatus;
  }

  let { status }: Props = $props();

  const dispatch = createEventDispatcher<{
    toggle: void;
  }>();

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    dispatch('toggle');
  }
</script>

<Button
  variant="ghost"
  size="icon"
  class="text-3xl hover:scale-110 transition h-12 w-12 min-h-[48px] min-w-[48px]"
  onclick={handleClick}
  title="Toggle completion status"
>
  {getStatusIcon(status)}
</Button>
