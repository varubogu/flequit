<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    class?: string;
    for?: string;
    children?: any;
  }

  let { class: className, for: htmlFor, children, ...restProps }: Props = $props();
</script>

<label
  for={htmlFor}
  class={cn(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</label>