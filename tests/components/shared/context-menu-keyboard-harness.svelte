<script lang="ts">
  import ContextMenuWrapper from '$lib/components/shared/context-menu-wrapper.svelte';
  import type { ContextMenuList } from '$lib/types/context-menu';

  let { items }: { items: ContextMenuList } = $props();
</script>

<ContextMenuWrapper {items}>
  <button type="button">Menu</button>
</ContextMenuWrapper>
