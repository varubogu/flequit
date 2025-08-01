<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  type Props = {
    class?: string;
    value?: string | number;
    onchange?: (event: Event) => void;
    children?: Snippet;
    id?: string;
  };

  let { class: className, value = $bindable(), children, ...restProps }: Props = $props();
</script>

<select
  bind:value
  class={cn(
    'border-input bg-background ring-offset-background focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...restProps}
>
  {@render children?.()}
</select>
