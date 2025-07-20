<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { DataService } from '$lib/services/data-service';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { ModeWatcher } from 'mode-watcher';
  import ContextMenu from '$lib/components/context-menu.svelte';
  
  // Initialize data and theme on mount
  onMount(() => {
    DataService.loadUserData();
  });

  // Initialize theme store (this will trigger theme detection and application)
  const _ = themeStore;
</script>

<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
  <slot />
</div>
<ContextMenu />