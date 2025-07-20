<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    for?: string;
  }

  let { class: className, for: htmlFor, ...restProps }: Props = $props();
</script>

<label
  for={htmlFor}
  class={cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...restProps}
>
  <slot />
</label>