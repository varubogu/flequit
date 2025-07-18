<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  type Props = {
    class?: string;
    value?: string;
    onchange?: (event: Event) => void;
    children?: Snippet;
  };

  let { 
    class: className, 
    value = $bindable(),
    children, 
    ...restProps 
  }: Props = $props();
</script>

<select
  bind:value
  class={cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</select>