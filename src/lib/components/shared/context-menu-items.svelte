<script lang="ts">
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import type { ContextMenuList, ContextMenuItem } from '$lib/types/context-menu';
  import { contextMenuStore } from '$lib/stores/context-menu.svelte.js';

  interface Props {
    items: ContextMenuList;
    class?: string;
  }

  let { items, class: className = 'w-48' }: Props = $props();

  // セパレーター以外のアイテムをカウント
  const menuItems = $derived(items.filter((item) => !('type' in item)) as ContextMenuItem[]);
  const itemCount = $derived(menuItems.length);

  // キーボードイベントハンドラ
  function handleKeyDown(event: KeyboardEvent) {
    if (!contextMenuStore.isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        contextMenuStore.selectNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        contextMenuStore.selectPrevious();
        break;
      case 'Enter': {
        event.preventDefault();
        const selectedIndex = contextMenuStore.activateSelected();
        if (selectedIndex !== null && selectedIndex < menuItems.length) {
          menuItems[selectedIndex].action();
        }
        break;
      }
      case 'Escape':
        contextMenuStore.close();
        break;
    }
  }
</script>

<ContextMenu.Content
  class={className}
  onOpenAutoFocus={() => {
    contextMenuStore.open(itemCount);
  }}
  onCloseAutoFocus={() => {
    contextMenuStore.close();
  }}
  onkeydown={handleKeyDown}
>
  {#each items as item, index (index)}
    {#if 'type' in item && item.type === 'separator'}
      <ContextMenu.Separator />
    {:else}
      {@const menuItem = item as ContextMenuItem}
      {@const menuItemIndex = items.slice(0, index).filter((i) => !('type' in i)).length}
      {@const isSelected = contextMenuStore.selectedIndex === menuItemIndex}
      <ContextMenu.Item
        onSelect={() => {
          menuItem.action();
        }}
        disabled={typeof menuItem.disabled === 'function' ? menuItem.disabled() : menuItem.disabled}
        class={menuItem.destructive
          ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
          : ''}
        data-selected={isSelected}
        onmouseenter={() => {
          if (contextMenuStore.isOpen) {
            contextMenuStore.selectIndex(menuItemIndex);
          }
        }}
      >
        {#if menuItem.icon}
          {@const IconComponent = menuItem.icon}
          <IconComponent class="mr-2 h-4 w-4" />
        {/if}
        <span>{typeof menuItem.label === 'function' ? menuItem.label() : menuItem.label}</span>
        {#if menuItem.keyboardShortcut}
          <span class="text-muted-foreground ml-auto text-xs">{menuItem.keyboardShortcut}</span>
        {/if}
      </ContextMenu.Item>
    {/if}
  {/each}
</ContextMenu.Content>
