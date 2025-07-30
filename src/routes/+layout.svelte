<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { DataService } from '$lib/services/data-service';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/sonner';

  // Initialize data on mount
  onMount(() => {
    DataService.loadUserData();
  });
</script>

<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
  <slot />
</div>
<Toaster />
