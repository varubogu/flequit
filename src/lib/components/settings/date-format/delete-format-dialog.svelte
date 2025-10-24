<script lang="ts">
  import * as AlertDialog from '$lib/components/ui/alert-dialog';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';

  interface Props {
    open: boolean;
    onConfirm: () => void;
  }

  let { open = $bindable(), onConfirm }: Props = $props();

  const translationService = useTranslation();
  const cancel = translationService.getMessage('cancel');
  const delete_msg = translationService.getMessage('delete');
  const deleteFormatTitle = translationService.getMessage('delete_format_title');
  const deleteFormatMessage = translationService.getMessage('delete_format_message');
</script>

<AlertDialog.Root bind:open>
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
