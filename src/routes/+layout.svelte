<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { backendService } from '$lib/services/backend-service';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { errorHandler } from '$lib/stores/error-handler.svelte';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/sonner';
  import ErrorPanel from '$lib/components/error/error-panel.svelte';

  // Initialize data on mount
  onMount(async () => {
    try {
      const service = backendService();
      const projects = await service.loadProjectData();
      // 初期化時は保存処理を行わない（loadProjectsDataを使用）
      taskStore.loadProjectsData(projects);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      errorHandler.addError({
        type: 'general',
        message: 'データの初期化に失敗しました',
        details: error instanceof Error ? error.message : String(error),
        retryable: true,
        context: { operation: 'データ初期化' }
      });
    }
  });
</script>

<ModeWatcher />
<div class="bg-background text-foreground min-h-screen">
  <slot />
</div>
<Toaster />
<ErrorPanel />
