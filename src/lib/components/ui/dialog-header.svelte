<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  type Props = {
    class?: string;
    children?: Snippet;
  };

  let { class: className, children, ...restProps }: Props = $props();
</script>

<div
  class={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
  {...restProps}
>
  {@render children?.()}
</div>