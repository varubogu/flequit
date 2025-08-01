<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    open: boolean;
    onConfirm: () => void;
  }

  let { open = $bindable(), onConfirm }: Props = $props();

  const cancel = reactiveMessage(m.cancel);
  const delete_msg = reactiveMessage(m.delete);
  const deleteFormatTitle = reactiveMessage(m.delete_format_title);
  const deleteFormatMessage = reactiveMessage(m.delete_format_message);
</script>

<AlertDialog.Root bind:open={open}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>{deleteFormatTitle()}</AlertDialog.Title>
        <AlertDialog.Description>
          {deleteFormatMessage()}
        </AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel>{cancel()}</AlertDialog.Cancel>
        <AlertDialog.Action onclick={onConfirm}>{delete_msg()}</AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
