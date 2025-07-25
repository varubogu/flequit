<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
  import type { Component } from 'svelte';

  export interface ContextMenuItem {
    label: string;
    action: () => void;
    icon?: Component;
    separator?: boolean;
    disabled?: boolean;
    destructive?: boolean;
  }

  interface Props {
    icon: string;
    label: string;
    count: number;
    isActive: boolean;
    onclick: () => void;
    contextMenuItems?: ContextMenuItem[];
    testId?: string;
  }

  let { icon, label, count, isActive, onclick, contextMenuItems = [], testId }: Props = $props();
</script>

{#if contextMenuItems.length > 0}
  <ContextMenu.Root>
    <ContextMenu.Trigger>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        class="w-full justify-between p-3 h-auto {isActive ? 'bg-muted' : ''} active:scale-100 active:brightness-[0.4] transition-all duration-100"
        {onclick}
        data-testid={testId}
      >
        <div class="flex items-center gap-2">
          <span class="text-lg">{icon}</span>
          <span class="font-medium">{label}</span>
        </div>
        <Badge variant="secondary" class="ml-auto">
          {count}
        </Badge>
      </Button>
    </ContextMenu.Trigger>
    <ContextMenu.Content class="w-48">
      {#each contextMenuItems as item}
        {#if item.separator}
          <ContextMenu.Separator />
        {:else}
          <ContextMenu.Item
            onselect={item.action}
            disabled={item.disabled}
            class={item.destructive ? "text-destructive focus:bg-destructive/10 focus:text-destructive" : ""}
          >
            {#if item.icon}
              {@const IconComponent = item.icon}
              <IconComponent class="h-4 w-4 mr-2" />
            {/if}
            <span>{item.label}</span>
          </ContextMenu.Item>
        {/if}
      {/each}
    </ContextMenu.Content>
  </ContextMenu.Root>
{:else}
  <Button
    variant={isActive ? "secondary" : "ghost"}
    class="w-full justify-between p-3 h-auto {isActive ? 'bg-muted' : ''} active:scale-100 active:brightness-[0.4] transition-all duration-100"
    {onclick}
    data-testid={testId}
  >
    <div class="flex items-center gap-2">
      <span class="text-lg">{icon}</span>
      <span class="font-medium">{label}</span>
    </div>
    <Badge variant="secondary" class="ml-auto">
      {count}
    </Badge>
  </Button>
{/if}
