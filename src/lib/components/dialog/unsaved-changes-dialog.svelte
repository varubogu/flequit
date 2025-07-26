<script lang="ts">
  import Dialog from "$lib/components/ui/dialog.svelte";
  import DialogContent from "$lib/components/ui/dialog-content.svelte";
  import DialogHeader from "$lib/components/ui/dialog-header.svelte";
  import DialogTitle from "$lib/components/ui/dialog-title.svelte";
  import DialogDescription from "$lib/components/ui/dialog-description.svelte";
  import DialogFooter from "$lib/components/ui/dialog-footer.svelte";
  import Button from "$lib/components/shared/button.svelte";
  import { Save, Trash2, X } from 'lucide-svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

  interface Props {
    show: boolean;
    onSaveAndContinue: () => void;
    onDiscardAndContinue: () => void;
    onCancel: () => void;
  }

  let {
    show,
    onSaveAndContinue,
    onDiscardAndContinue,
    onCancel
  }: Props = $props();

  const save = reactiveMessage(m.save);
  const cancel = reactiveMessage(m.cancel);
  const discard_changes = reactiveMessage(m.discard_changes);
  const confirm_discard_changes = reactiveMessage(m.confirm_discard_changes);
  const unsaved_task_message = reactiveMessage(m.unsaved_task_message);
</script>

<Dialog open={show} onOpenChange={(open: boolean) => !open && onCancel()}>
  <DialogContent class="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>{confirm_discard_changes()}</DialogTitle>
      <DialogDescription>
        {unsaved_task_message()}
      </DialogDescription>
    </DialogHeader>

    <DialogFooter class="flex flex-row gap-2 justify-center">
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
      <Button
        variant="ghost"
        size="icon"
        onclick={onCancel}
        title={cancel()}
      >
        <X class="h-4 w-4" />
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
