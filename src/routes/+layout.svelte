<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { DataService } from '$lib/services/data-service';
  import { ModeWatcher } from 'mode-watcher';
  import ContextMenu from '$lib/components/shared/context-menu.svelte';

  // Initialize data on mount
  onMount(() => {
    DataService.loadUserData();
  });
</script>

<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
  <slot />
</div>
<ContextMenu />
