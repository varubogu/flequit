<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import Button from '$lib/components/shared/button.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages.js';

  interface Props {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { open, onConfirm, onCancel }: Props = $props();

  // Reactive messages
  const confirm_discard_changes = reactiveMessage(m.confirm_discard_changes);
  const unsaved_task_message = reactiveMessage(m.unsaved_task_message);
  const discard_changes = reactiveMessage(m.discard_changes);
  const keep_editing = reactiveMessage(m.keep_editing);
</script>

<Dialog.Root {open} onOpenChange={(open) => { if (!open) onCancel(); }}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{confirm_discard_changes()}</Dialog.Title>
    </Dialog.Header>

    <Dialog.Description>
      {unsaved_task_message()}
    </Dialog.Description>

    <Dialog.Footer>
      <Button variant="secondary" onclick={onCancel}>
        {keep_editing()}
      </Button>
      <Button variant="destructive" onclick={onConfirm}>
        {discard_changes()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
