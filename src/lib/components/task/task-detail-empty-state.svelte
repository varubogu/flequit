<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';

  const translationService = getTranslationService();

  // Reactive messages
  const no_task_selected = translationService.getMessage('no_task_selected');
  const select_task_to_view_details = translationService.getMessage('select_task_to_view_details');
</script>

<div class="flex flex-1 items-center justify-center">
  <div class="text-muted-foreground text-center">
    <div class="mb-4 text-6xl">📝</div>
    <h2 class="mb-2 text-xl font-semibold">{no_task_selected()}</h2>
    <p>{select_task_to_view_details()}</p>
  </div>
</div>
