<script lang="ts">
  import type { Tag } from '$lib/types/task';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import * as m from '$paraglide/messages.js';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    open: boolean;
    tag: Tag | null;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { open, tag, onConfirm, onCancel }: Props = $props();

  // Reactive messages
  const deleteTag = reactiveMessage(m.delete_tag);
  const deleteTagDescription = reactiveMessage(() => 
    m.delete_tag_description({ tagName: tag?.name || '' })
  );
  const cancel = reactiveMessage(m.cancel);
  const delete_msg = reactiveMessage(m.delete);
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{deleteTag()}</AlertDialog.Title>
      <AlertDialog.Description>
        {deleteTagDescription()}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={onCancel}>{cancel()}</AlertDialog.Cancel>
      <AlertDialog.Action onclick={onConfirm}>{delete_msg()}</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>