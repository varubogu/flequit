<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { getStatusIcon } from '$lib/utils/task-utils';
  import type { TaskStatus } from '$lib/types/task';

  interface Props {
    status: TaskStatus;
    ontoggle: (event: MouseEvent) => void;
  }

  let { status, ontoggle }: Props = $props();
</script>

<Button
  variant="ghost"
  size="icon"
  class="h-12 min-h-[48px] w-12 min-w-[48px] text-3xl transition hover:scale-110"
  onclick={(e?: Event) => {
    e?.stopPropagation();
    ontoggle(e as MouseEvent);
  }}
  title="Toggle completion status"
>
  {getStatusIcon(status)}
</Button>
