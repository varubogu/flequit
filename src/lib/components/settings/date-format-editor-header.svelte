<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const translationService = getTranslationService();
  const dateFormatEditor = translationService.getMessage('date_format_editor');
  const close = translationService.getMessage('close');
</script>

<div class="mb-6 flex items-center justify-between">
  <h2 class="text-xl font-semibold">{dateFormatEditor()}</h2>
  <Button variant="ghost" size="sm" onclick={onClose}>
    {close()}
  </Button>
</div>
