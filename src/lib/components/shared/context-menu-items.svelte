<script lang="ts">
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import type { ContextMenuList, ContextMenuItem } from '$lib/types/context-menu';

  interface Props {
    items: ContextMenuList;
    class?: string;
  }

  let { items, class: className = "w-48" }: Props = $props();
</script>

<ContextMenu.Content class={className}>
  {#each items as item}
    {#if 'type' in item && item.type === 'separator'}
      <ContextMenu.Separator />
    {:else}
      {@const menuItem = item as ContextMenuItem}
      <ContextMenu.Item 
        onSelect={() => {
          menuItem.action();
        }}
        disabled={typeof menuItem.disabled === 'function' ? menuItem.disabled() : menuItem.disabled}
        class={menuItem.destructive ? "text-destructive focus:bg-destructive/10 focus:text-destructive" : ""}
      >
        {#if menuItem.icon}
          {@const IconComponent = menuItem.icon}
          <IconComponent class="h-4 w-4 mr-2" />
        {/if}
        <span>{typeof menuItem.label === 'function' ? menuItem.label() : menuItem.label}</span>
        {#if menuItem.keyboardShortcut}
          <span class="ml-auto text-xs text-muted-foreground">{menuItem.keyboardShortcut}</span>
        {/if}
      </ContextMenu.Item>
    {/if}
  {/each}
</ContextMenu.Content>
