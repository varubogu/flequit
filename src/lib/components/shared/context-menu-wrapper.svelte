<script lang="ts">
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import ContextMenuItems from '$lib/components/shared/context-menu-items.svelte';
  import type { ContextMenuList } from '$lib/types/context-menu';

  interface Props {
    items: ContextMenuList;
    children: import('svelte').Snippet;
    contentClass?: string;
  }

  let { items, children, contentClass = 'w-48' }: Props = $props();
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    {@render children()}
  </ContextMenu.Trigger>

  <ContextMenuItems {items} class={contentClass} />
</ContextMenu.Root>
