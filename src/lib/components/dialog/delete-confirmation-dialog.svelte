<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import Button from '$lib/components/shared/button.svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';

  interface Props {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { open, title, message, onConfirm, onCancel }: Props = $props();

  // 翻訳サービスを取得
  const translationService = getTranslationService();

  // Reactive messages
  const delete_msg = translationService.getMessage('delete');
  const cancel = translationService.getMessage('cancel');
</script>

<Dialog.Root {open} onOpenChange={(open) => { if (!open) onCancel(); }}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
    </Dialog.Header>

    <Dialog.Description>
      {message}
    </Dialog.Description>

    <Dialog.Footer>
      <Button variant="secondary" onclick={onCancel}>
        {cancel()}
      </Button>
      <Button variant="destructive" onclick={onConfirm}>
        {delete_msg()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
