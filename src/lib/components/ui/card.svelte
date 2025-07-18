<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  type Props = {
    class?: string;
    children?: Snippet;
    onclick?: () => void;
    onkeydown?: (event: KeyboardEvent) => void;
    role?: string;
    tabindex?: number;
  };

  let { class: className, children, ...restProps }: Props = $props();
</script>

<div
  class={cn(
    "rounded-lg border bg-card text-card-foreground shadow-sm",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>