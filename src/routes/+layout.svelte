<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initBackendContext } from '$lib/context/backend-context';
  import { taskStore } from '$lib/stores/tasks.svelte';
  import { accountStore } from '$lib/stores/account-store.svelte';
  import { errorHandler } from '$lib/stores/error-handler.svelte';
  import { TagBookmarkService } from '$lib/services/domain/tag-bookmark';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/sonner';
  import ErrorPanel from '$lib/components/error/error-panel.svelte';

  const backendContext = initBackendContext();

  // Initialize data on mount
  onMount(async () => {
    try {
      console.log('[+layout] onMount started');
      const backend = await backendContext.service;
      console.log('[+layout] Backend service ready');

      // アカウント情報を読み込む
      console.log('[+layout] Loading account...');
      const account = await backend.initialization.loadAccount();
      console.log('[+layout] Account loaded:', account);

      if (!account) {
        console.error('[+layout] Account is null!');
      } else {
        console.log('[+layout] Account userId:', account.userId);
      }

      accountStore.setCurrentAccount(account);
      console.log('[+layout] accountStore.currentUserId:', accountStore.currentUserId);

      console.log('[+layout] Loading project data...');
      const projects = await backend.initialization.loadProjectData();
      console.log('[+layout] Project data loaded, count:', projects.length);
      // 初期化時は保存処理を行わない（loadProjectsDataを使用）
      taskStore.loadProjectsData(projects);

      // ユーザーの全タグブックマークを読み込む
      console.log('[+layout] Loading tag bookmarks...');
      await TagBookmarkService.loadAllBookmarks();
      console.log('[+layout] Initialization complete');
    } catch (error) {
      console.error('[+layout] Failed to load initial data:', error);
      console.error('[+layout] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
