<script lang="ts">
  import { Drawer as DrawerPrimitive } from 'vaul-svelte';
  import type { Snippet } from 'svelte';

  // vaul-svelte 0.3.2 は RootProps を出さない。ルートの props 型は Props。
  // ランタイムは default slot なので、Svelte 5 の children を明示して中へ渡す。
  let {
    shouldScaleBackground = true,
    open = $bindable(false),
    activeSnapPoint = $bindable(null),
    children,
    ...restProps
  }: DrawerPrimitive.Props & { children?: Snippet } = $props();
</script>

<DrawerPrimitive.Root {shouldScaleBackground} bind:open bind:activeSnapPoint {...restProps}>
  {@render children?.()}
</DrawerPrimitive.Root>
