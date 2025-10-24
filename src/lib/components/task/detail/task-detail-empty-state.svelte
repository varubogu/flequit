<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';

  const translationService = useTranslation();

  // Reactive messages
  const no_task_selected = translationService.getMessage('no_task_selected');
  const select_task_to_view_details = translationService.getMessage('select_task_to_view_details');
</script>

<div class="flex flex-1 items-center justify-center" data-testid="task-detail-empty-state">
  <div class="text-muted-foreground text-center">
    <div class="mb-4 text-6xl">📝</div>
    <h2 class="mb-2 text-xl font-semibold">{no_task_selected()}</h2>
    <p>{select_task_to_view_details()}</p>
  </div>
</div>
