<script lang="ts">
  import Dialog from '$lib/components/ui/dialog.svelte';
  import DialogContent from '$lib/components/ui/dialog-content.svelte';
  import DialogHeader from '$lib/components/ui/dialog-header.svelte';
  import DialogTitle from '$lib/components/ui/dialog-title.svelte';
  import DialogDescription from '$lib/components/ui/dialog-description.svelte';
  import DialogFooter from '$lib/components/ui/dialog-footer.svelte';
  import Button from '$lib/components/shared/button.svelte';
  import { Save, Trash2, X } from 'lucide-svelte';
  import { useTranslation } from '$lib/hooks/use-translation.svelte';

  interface Props {
    show: boolean;
    onSaveAndContinue: () => void;
    onDiscardAndContinue: () => void;
    onCancel: () => void;
  }

  let { show, onSaveAndContinue, onDiscardAndContinue, onCancel }: Props = $props();

  const translationService = useTranslation();
  const save = translationService.getMessage('save');
  const cancel = translationService.getMessage('cancel');
  const discard_changes = translationService.getMessage('discard_changes');
  const confirm_discard_changes = translationService.getMessage('confirm_discard_changes');
  const unsaved_task_message = translationService.getMessage('unsaved_task_message');
</script>

<Dialog open={show} onOpenChange={(open: boolean) => !open && onCancel()}>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>{confirm_discard_changes()}</DialogTitle>
      <DialogDescription>
        {unsaved_task_message()}
      </DialogDescription>
    </DialogHeader>

    <DialogFooter class="flex flex-row justify-center gap-2">
      <Button size="icon" onclick={onSaveAndContinue} title={save()}>
        <Save class="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onclick={onDiscardAndContinue}
        title={discard_changes()}
      >
        <Trash2 class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onclick={onCancel} title={cancel()}>
        <X class="h-4 w-4" />
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
