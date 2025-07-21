<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
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
  class="text-3xl hover:scale-110 transition h-12 w-12 min-h-[48px] min-w-[48px]"
  onclick={(e?: Event) => {
    e?.stopPropagation();
    ontoggle(e as MouseEvent);
  }}
  title="Toggle completion status"
>
  {getStatusIcon(status)}
</Button>
