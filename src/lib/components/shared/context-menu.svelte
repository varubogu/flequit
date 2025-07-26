<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { contextMenuStore } from '$lib/stores/context-menu.svelte';
  import Button from '$lib/components/shared/button.svelte';

  let menuElement: HTMLElement;
  let { state } = contextMenuStore;

  function handleClickOutside(event: MouseEvent) {
    if (state.show && menuElement && !menuElement.contains(event.target as Node)) {
      contextMenuStore.close();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      contextMenuStore.close();
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleKeydown, true);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside, true);
    document.removeEventListener('keydown', handleKeydown, true);
  });

  function executeAction(action: () => void) {
    action();
    contextMenuStore.close();
  }
</script>

{#if state.show}
  <div
    bind:this={menuElement}
    class="fixed bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-1 z-50 min-w-[180px]"
    style="left: {state.x}px; top: {state.y}px;"
  >
    <ul class="space-y-1">
      {#each state.options as option}
        {#if option.separator}
          <li class="border-b border-border -mx-1 my-1"></li>
        {:else}
          <li>
            <Button
              variant="ghost"
              class="w-full justify-start h-8 px-2 py-1.5 text-sm"
              disabled={option.disabled}
              onclick={() => executeAction(option.action)}
            >
              {#if option.icon}
                <svelte:component this={option.icon} class="h-4 w-4 mr-2" />
              {/if}
              <span>{option.label}</span>
            </Button>
          </li>
        {/if}
      {/each}
    </ul>
  </div>
{/if}
