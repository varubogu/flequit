<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { DataService } from '$lib/services/data-service';
  
  // Initialize data on mount
  onMount(() => {
    DataService.loadUserData();
  });
</script>

<div class="min-h-screen bg-background text-foreground">
  <slot />
</div>