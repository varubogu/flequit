<script lang="ts">
  import { errorHandler, type ErrorInfo } from '$lib/stores/error-handler.svelte';
  import { Button } from '$lib/components/ui/button';
  import { X, AlertCircle, RefreshCw, Wifi, AlertTriangle } from 'lucide-svelte';

  let { error }: { error: ErrorInfo } = $props();

  function getIcon(type: ErrorInfo['type']) {
    switch (type) {
      case 'sync':
        return RefreshCw;
      case 'network':
        return Wifi;
      case 'validation':
        return AlertTriangle;
      default:
        return AlertCircle;
    }
  }

  function getBgColor(type: ErrorInfo['type']) {
    switch (type) {
      case 'validation':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'network':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-700 dark:text-yellow-300';
      case 'sync':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-700 dark:text-blue-300';
      default:
        return 'bg-destructive/10 border-destructive/20 text-destructive';
    }
  }

  function handleDismiss() {
    errorHandler.removeError(error.id);
  }

  function handleRetry() {
    // リトライ機能は将来的に実装
    handleDismiss();
  }

  const IconComponent = getIcon(error.type);
</script>

<div class="rounded-lg border p-4 {getBgColor(error.type)} mb-2">
  <div class="flex items-start gap-3">
    <IconComponent class="mt-0.5 h-4 w-4 flex-shrink-0" />
    <div class="min-w-0 flex-1">
      <div class="mb-1 flex items-center justify-between">
        <h4 class="text-sm font-medium">{error.message}</h4>
        <div class="flex flex-shrink-0 gap-1">
          {#if error.retryable}
            <Button
              variant="ghost"
              size="sm"
              onclick={handleRetry}
              class="h-6 w-6 p-0 hover:bg-black/10"
              title="再試行"
            >
              <RefreshCw class="h-3 w-3" />
            </Button>
          {/if}
          <Button
            variant="ghost"
            size="sm"
            onclick={handleDismiss}
            class="h-6 w-6 p-0 hover:bg-black/10"
            title="閉じる"
          >
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>
      {#if error.details}
        <p class="mb-1 text-sm opacity-80">
          {error.details}
        </p>
      {/if}
      {#if error.context?.operation}
        <p class="text-xs opacity-60">
          操作: {error.context.operation}
          {#if error.context.resourceType && error.context.resourceId}
            | {error.context.resourceType}: {error.context.resourceId}
          {/if}
        </p>
      {/if}
    </div>
  </div>
</div>
