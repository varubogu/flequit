<script lang="ts">
  import Button from '$lib/components/button.svelte';
  import SettingsDraggableItems from '../settings-draggable-items.svelte';
  import ConfirmDialog from '../confirm-dialog.svelte';
  import { viewsVisibilityStore } from '$lib/stores/views-visibility.svelte';
  import { RotateCcw } from 'lucide-svelte';

  let showResetConfirm = $state(false);

  function handleResetViews() {
    viewsVisibilityStore.resetToDefaults();
    showResetConfirm = false;
  }
</script>

<section id="settings-views">
  <div class="space-y-6">
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium">Views Settings</h3>
        <Button variant="outline" size="sm" onclick={() => showResetConfirm = true}>
          <RotateCcw class="h-3 w-3 mr-2" />
          Reset to Defaults
        </Button>
      </div>
      <p class="text-sm text-muted-foreground mb-4">
        Drag and drop to reorder views or move them between visible and hidden sections.
      </p>
      <SettingsDraggableItems />
    </div>
  </div>
</section>

{#if showResetConfirm}
  <ConfirmDialog
    show={showResetConfirm}
    title="Reset View Settings"
    message="Are you sure you want to reset the view visibility and order to the default settings?"
    confirmText="Reset"
    onConfirm={handleResetViews}
    onCancel={() => showResetConfirm = false}
  />
{/if}