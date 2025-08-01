<script lang="ts">
  import { getTranslationService } from '$lib/stores/locale.svelte';
  import type { Tag } from '$lib/types/task';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

  interface Props {
    open: boolean;
    tag: Tag | null;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { open, tag, onConfirm, onCancel }: Props = $props();

  const translationService = getTranslationService();
  // Reactive messages
  const deleteTag = translationService.getMessage('delete_tag');
  const deleteTagDescription = $derived(() => 
    translationService.getMessage('delete_tag_description', { tagName: tag?.name || '' })()
  );
  const cancel = translationService.getMessage('cancel');
  const delete_msg = translationService.getMessage('delete');
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{deleteTag()}</AlertDialog.Title>
      <AlertDialog.Description>
        {deleteTagDescription}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={onCancel}>{cancel()}</AlertDialog.Cancel>
      <AlertDialog.Action onclick={onConfirm}>{delete_msg()}</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>