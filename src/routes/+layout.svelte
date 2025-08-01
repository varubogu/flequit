<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { backendService } from '$lib/services/backend-service';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/sonner';

  // Initialize data on mount
  onMount(async () => {
    const service = backendService();
    const projects = await service.loadProjectData();
    taskStore.setProjects(projects);
  });
</script>

<ModeWatcher />
<div class="bg-background text-foreground min-h-screen">
  <slot />
</div>
<Toaster />
