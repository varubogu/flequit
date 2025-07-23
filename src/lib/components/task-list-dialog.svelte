<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import Button from '$lib/components/button.svelte';
  import * as m from '$paraglide/messages.js';
  import Input from '$lib/components/ui/input.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';

  interface Props {
    open: boolean;
    mode: 'add' | 'edit';
    title?: string;
    initialName?: string;
    onsave?: (data: { name: string }) => void;
    onclose?: () => void;
  }

  let { open = false, mode, title = '', initialName = '', onsave, onclose }: Props = $props();

  let name = $state(initialName);
  
  // Reactiveメッセージ
  const cancel = reactiveMessage(m.cancel);
  const save = reactiveMessage(m.save);

  $effect(() => {
    if (open) {
      name = initialName;
    }
  });

  function handleSave() {
    if (name.trim()) {
      onsave?.({ name: name.trim() });
      handleClose();
    }
  }

  function handleClose() {
    onclose?.();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSave();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={(newOpen) => !newOpen && handleClose()}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>
        {mode === 'add' ? 'New Task List' : 'Edit Task List'}
      </Dialog.Title>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="task-list-name" class="text-right">Task List Name</Label>
        <Input
          id="task-list-name"
          bind:value={name}
          placeholder="Enter task list name"
          class="col-span-3"
          onkeydown={handleKeydown}
        />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={handleClose}>{cancel()}</Button>
      <Button onclick={handleSave} disabled={!name.trim()}>{save()}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>