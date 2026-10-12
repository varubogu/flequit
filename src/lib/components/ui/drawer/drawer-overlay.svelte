<script lang="ts">
  import { Drawer as DrawerPrimitive } from 'vaul-svelte';
  import { cn } from '$lib/utils.js';

  // bits-ui 0.21（vaul-svelte 0.3.2 が依存）の要素参照は ref ではなく el。
  let {
    el = $bindable(undefined),
    class: className,
    ...restProps
  }: DrawerPrimitive.OverlayProps = $props();
</script>

<DrawerPrimitive.Overlay
  bind:el
  data-slot="drawer-overlay"
  class={cn(
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
    className
  )}
  {...restProps}
/>
