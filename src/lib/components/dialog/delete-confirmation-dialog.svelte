<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import Button from '$lib/components/shared/button.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages.js';

  interface Props {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { open, title, message, onConfirm, onCancel }: Props = $props();

  // Reactive messages
  const delete_item = reactiveMessage(m.delete_item);
  const cancel = reactiveMessage(m.cancel);
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
        {delete_item()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
