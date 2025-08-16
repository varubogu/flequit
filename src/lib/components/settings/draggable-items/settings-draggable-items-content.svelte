<script lang="ts">
  import { draggable, droppable } from '@thisux/sveltednd';
  import { GripVertical } from 'lucide-svelte';
  import type { SettingsDraggableItemsLogic } from './settings-draggable-items-logic.svelte';

  interface Props {
    logic: SettingsDraggableItemsLogic;
  }

  let { logic }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
  <!-- Visible Views -->
  <div>
    <h4 class="mb-3 text-base font-medium">{logic.visibleInSidebar()}</h4>
    <div
      class="bg-background relative min-h-[200px] space-y-1 rounded-lg border p-2 {logic.dragState
        .isDragging && logic.dragState.dropZone === 'visible'
        ? 'border-primary bg-primary/5'
        : ''}"
      use:droppable={{
        container: 'visible',
        callbacks: {
          onDrop: logic.handleDrop.bind(logic),
          onDragOver: (state) => logic.handleDragOver('visible', state.targetElement)
        }
      }}
    >
      {#each logic.localVisibleItems as item, index (item.id)}
        <!-- Drop indicator -->
        {#if logic.dragState.isDragging && logic.dragState.dropZone === 'visible' && logic.dragState.insertIndex === index}
          <div class="bg-primary mx-2 my-1 h-0.5 rounded-full"></div>
        {/if}

        <div
          use:draggable={{
            container: 'visible',
            dragData: item,
            callbacks: {
              onDragStart: () => logic.handleDragStart('visible', item),
              onDragEnd: logic.handleDragEnd.bind(logic)
            }
          }}
          data-item-id={item.id}
          class="bg-card hover:bg-muted flex cursor-grab items-center rounded-md border p-2 {logic
            .dragState.draggedItem?.id === item.id
            ? 'opacity-50'
            : ''}"
        >
          <GripVertical class="text-muted-foreground mr-2 h-5 w-5" />
          <span class="flex-1 text-sm">{item.icon} {item.label}</span>
        </div>
      {/each}

      <!-- Drop indicator at end -->
      {#if logic.dragState.isDragging && logic.dragState.dropZone === 'visible' && (logic.dragState.insertIndex === -1 || logic.dragState.insertIndex >= logic.localVisibleItems.length)}
        <div class="bg-primary mx-2 my-1 h-0.5 rounded-full"></div>
      {/if}
    </div>
  </div>

  <!-- Hidden Views -->
  <div>
    <h4 class="mb-3 text-base font-medium">{logic.hiddenFromSidebar()}</h4>
    <div
      class="bg-muted/50 relative min-h-[200px] space-y-1 rounded-lg border p-2 {logic.dragState
        .isDragging && logic.dragState.dropZone === 'hidden'
        ? 'border-primary bg-primary/5'
        : ''}"
      use:droppable={{
        container: 'hidden',
        callbacks: {
          onDrop: logic.handleDrop.bind(logic),
          onDragOver: (state) => logic.handleDragOver('hidden', state.targetElement)
        }
      }}
    >
      {#each logic.localHiddenItems as item, index (item.id)}
        <!-- Drop indicator -->
        {#if logic.dragState.isDragging && logic.dragState.dropZone === 'hidden' && logic.dragState.insertIndex === index}
          <div class="bg-primary mx-2 my-1 h-0.5 rounded-full"></div>
        {/if}

        <div
          use:draggable={{
            container: 'hidden',
            dragData: item,
            callbacks: {
              onDragStart: () => logic.handleDragStart('hidden', item),
              onDragEnd: logic.handleDragEnd.bind(logic)
            }
          }}
          data-item-id={item.id}
          class="bg-card hover:bg-muted flex cursor-grab items-center rounded-md border p-2 {logic
            .dragState.draggedItem?.id === item.id
            ? 'opacity-50'
            : ''}"
        >
          <GripVertical class="text-muted-foreground mr-2 h-5 w-5" />
          <span class="flex-1 text-sm">{item.icon} {item.label}</span>
        </div>
      {/each}

      <!-- Drop indicator at end -->
      {#if logic.dragState.isDragging && logic.dragState.dropZone === 'hidden' && (logic.dragState.insertIndex === -1 || logic.dragState.insertIndex >= logic.localHiddenItems.length)}
        <div class="bg-primary mx-2 my-1 h-0.5 rounded-full"></div>
      {/if}
    </div>
  </div>
</div>
