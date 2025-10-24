<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import SettingsDraggableItems from '$lib/components/settings/draggable-items/settings-draggable-items.svelte';
  import ConfirmDialog from '../../dialog/confirm-dialog.svelte';
  import { viewsVisibilityStore } from '$lib/stores/views-visibility.svelte';
  import { RotateCcw } from 'lucide-svelte';

  const translationService = useTranslation();
  let showResetConfirm = $state(false);

  function handleResetViews() {
    viewsVisibilityStore.resetToDefaults();
    showResetConfirm = false;
  }

  // Reactive messages
  const viewsSettings = translationService.getMessage('views_settings');
  const resetToDefaults = translationService.getMessage('reset_to_defaults');
  const viewsDescriptionText = translationService.getMessage('views_description_text');
  const resetViewSettings = translationService.getMessage('reset_view_settings');
  const resetViewConfirmation = translationService.getMessage('reset_view_confirmation');
  const reset = translationService.getMessage('reset');
</script>

<section id="settings-views">
  <div class="space-y-6">
    <div>
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-medium">{viewsSettings()}</h3>
        <Button variant="outline" size="sm" onclick={() => (showResetConfirm = true)}>
          <RotateCcw class="mr-2 h-3 w-3" />
          {resetToDefaults()}
        </Button>
      </div>
      <p class="text-muted-foreground mb-4 text-sm">
        {viewsDescriptionText()}
      </p>
      <SettingsDraggableItems />
    </div>
  </div>
</section>

{#if showResetConfirm}
  <ConfirmDialog
    show={showResetConfirm}
    title={resetViewSettings()}
    message={resetViewConfirmation()}
    confirmText={reset()}
    onConfirm={handleResetViews}
    onCancel={() => (showResetConfirm = false)}
  />
{/if}
