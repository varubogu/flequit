<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import { DragDropManager, type DropTarget } from '$lib/utils/drag-drop';
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
    isCollapsed?: boolean;
    onclick: () => void;
    contextMenuItems?: ContextMenuItem[];
    testId?: string;
    dropTarget?: DropTarget;
    onDrop?: (dragData: unknown) => void;
  }

  let {
    icon,
    label,
    count,
    isActive,
    isCollapsed = false,
    onclick,
    contextMenuItems = [],
    testId,
    dropTarget,
    onDrop
  }: Props = $props();

  // Drag & Drop handlers
  function handleDragOver(event: DragEvent) {
    if (!dropTarget) return;
    DragDropManager.handleDragOver(event, dropTarget);
  }

  function handleDrop(event: DragEvent) {
    if (!dropTarget || !onDrop) return;

    const dragData = DragDropManager.handleDrop(event, dropTarget);
    if (dragData) {
      onDrop(dragData);
    }
  }

  function handleDragEnter(event: DragEvent, element: HTMLElement) {
    if (!dropTarget) return;
    DragDropManager.handleDragEnter(event, element);
  }

  function handleDragLeave(event: DragEvent, element: HTMLElement) {
    if (!dropTarget) return;
    DragDropManager.handleDragLeave(event, element);
  }
</script>

{#if contextMenuItems.length > 0}
  <ContextMenu.Root>
    <ContextMenu.Trigger>
      <div
        role="region"
        ondragover={dropTarget ? handleDragOver : undefined}
        ondrop={dropTarget ? handleDrop : undefined}
        ondragenter={dropTarget
          ? (e) => handleDragEnter(e, e.currentTarget as HTMLElement)
          : undefined}
        ondragleave={dropTarget
          ? (e) => handleDragLeave(e, e.currentTarget as HTMLElement)
          : undefined}
      >
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          class={isCollapsed
            ? 'h-auto w-full justify-center p-2 ' +
              (isActive ? 'bg-muted' : '') +
              ' transition-all duration-100 active:scale-100 active:brightness-[0.4]'
            : 'h-auto w-full justify-between p-3 ' +
              (isActive ? 'bg-muted' : '') +
              ' transition-all duration-100 active:scale-100 active:brightness-[0.4]'}
          {onclick}
          data-testid={testId}
        >
          {#if isCollapsed}
            <span class="text-lg">{icon}</span>
          {:else}
            <div class="flex items-center gap-2">
              <span class="text-lg">{icon}</span>
              <span class="font-medium">{label}</span>
            </div>
            <Badge variant="secondary" class="ml-auto">
              {count}
            </Badge>
          {/if}
        </Button>
      </div>
    </ContextMenu.Trigger>
    <ContextMenu.Content class="w-48">
      {#each contextMenuItems as item, index (index)}
        {#if item.separator}
          <ContextMenu.Separator />
        {:else}
          <ContextMenu.Item
            onselect={item.action}
            disabled={item.disabled}
            class={item.destructive
              ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
              : ''}
          >
            {#if item.icon}
              {@const IconComponent = item.icon}
              <IconComponent class="mr-2 h-4 w-4" />
            {/if}
            <span>{item.label}</span>
          </ContextMenu.Item>
        {/if}
      {/each}
    </ContextMenu.Content>
  </ContextMenu.Root>
{:else}
  <div
    role="region"
    ondragover={dropTarget ? handleDragOver : undefined}
    ondrop={dropTarget ? handleDrop : undefined}
    ondragenter={dropTarget ? (e) => handleDragEnter(e, e.currentTarget as HTMLElement) : undefined}
    ondragleave={dropTarget ? (e) => handleDragLeave(e, e.currentTarget as HTMLElement) : undefined}
  >
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      class={isCollapsed
        ? 'h-auto w-full justify-center p-2 ' +
          (isActive ? 'bg-muted' : '') +
          ' transition-all duration-100 active:scale-100 active:brightness-[0.4]'
        : 'h-auto w-full justify-between p-3 ' +
          (isActive ? 'bg-muted' : '') +
          ' transition-all duration-100 active:scale-100 active:brightness-[0.4]'}
      {onclick}
      data-testid={testId}
    >
      {#if isCollapsed}
        <span class="text-lg">{icon}</span>
      {:else}
        <div class="flex items-center gap-2">
          <span class="text-lg">{icon}</span>
          <span class="font-medium">{label}</span>
        </div>
        <Badge variant="secondary" class="ml-auto">
          {count}
        </Badge>
      {/if}
    </Button>
  </div>
{/if}
