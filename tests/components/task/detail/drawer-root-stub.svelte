<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open = false,
    onOpenChange,
    children
  }: {
    open?: boolean;
    onOpenChange?: (next: boolean) => void;
    children?: Snippet;
  } = $props();
</script>

<div data-testid="drawer-root" data-open={String(open)}>
  <button type="button" onclick={() => onOpenChange?.(false)}>dismiss drawer</button>
  <button type="button" onclick={() => onOpenChange?.(true)}>keep drawer</button>
  {@render children?.()}
</div>
