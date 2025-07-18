<script lang="ts">
  import { onMount } from 'svelte';
  import { LayoutService } from '$lib/services/layout-service';
  import type { Snippet } from 'svelte';

  interface Props {
    leftPane: Snippet;
    rightPane: Snippet;
  }

  let { leftPane, rightPane }: Props = $props();
  
  let containerRef: HTMLDivElement;
  let isResizing = $state(false);
  let leftPaneWidth = $state(384); // 96 * 4 = 384px (w-96)
  
  onMount(() => {
    const preferences = LayoutService.loadPreferences();
    // Convert percentage to pixels (assuming container width)
    const containerWidth = containerRef.clientWidth;
    leftPaneWidth = Math.max(320, Math.min(800, (preferences.taskListPaneSize / 100) * containerWidth));
  });

  function handleMouseDown(event: MouseEvent) {
    isResizing = true;
    event.preventDefault();
    
    const startX = event.clientX;
    const startWidth = leftPaneWidth;
    
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(320, Math.min(800, startWidth + deltaX));
      leftPaneWidth = newWidth;
      
      // Save preferences
      const containerWidth = containerRef.clientWidth;
      const percentage = (newWidth / containerWidth) * 100;
      LayoutService.updatePaneSizes(percentage, 100 - percentage);
    }
    
    function handleMouseUp() {
      isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      leftPaneWidth = Math.max(320, leftPaneWidth - 10);
      savePreferences();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      leftPaneWidth = Math.min(800, leftPaneWidth + 10);
      savePreferences();
    }
  }
  
  function savePreferences() {
    const containerWidth = containerRef.clientWidth;
    const percentage = (leftPaneWidth / containerWidth) * 100;
    LayoutService.updatePaneSizes(percentage, 100 - percentage);
  }
</script>

<div 
  bind:this={containerRef}
  class="flex-1 flex"
  class:select-none={isResizing}
>
  <!-- Left Pane -->
  <div 
    class="border-r flex-shrink-0"
    style="width: {leftPaneWidth}px"
  >
    {@render leftPane()}
  </div>
  
  <!-- Resize Handle -->
  <button 
    class="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors relative group flex-shrink-0 border-0 p-0 focus:outline-none focus:ring-2 focus:ring-primary"
    class:bg-primary={isResizing}
    onmousedown={handleMouseDown}
    onkeydown={handleKeyDown}
    aria-label="Resize panels with mouse or arrow keys"
    tabindex="0"
  >
    <!-- Visual indicator -->
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
         class:opacity-100={isResizing}>
      <div class="w-0.5 h-8 bg-white rounded-full"></div>
    </div>
  </button>
  
  <!-- Right Pane -->
  <div class="flex-1 min-w-0">
    {@render rightPane()}
  </div>
</div>

<style>
  .select-none {
    user-select: none;
  }
</style>