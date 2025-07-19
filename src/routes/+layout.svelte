<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { DataService } from '$lib/services/data-service';
  import { themeStore } from '$lib/stores/theme.svelte';
  
  // Initialize data and theme on mount
  onMount(() => {
    DataService.loadUserData();
  });

  // Initialize theme store (this will trigger theme detection and application)
  const _ = themeStore;
</script>

<div class="min-h-screen bg-background text-foreground">
  <slot />
</div>