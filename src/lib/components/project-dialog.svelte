<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Label from '$lib/components/ui/label.svelte';

  interface Props {
    open: boolean;
    mode: 'add' | 'edit';
    title?: string;
    initialName?: string;
    initialColor?: string;
  }

  let { open = false, mode, title = '', initialName = '', initialColor = '#3b82f6' }: Props = $props();

  let name = $state(initialName);
  let color = $state(initialColor);

  const dispatch = createEventDispatcher<{
    save: { name: string; color: string };
    close: void;
  }>();

  $effect(() => {
    if (open) {
      name = initialName;
      color = initialColor;
    }
  });

  function handleSave() {
    if (name.trim()) {
      dispatch('save', { name: name.trim(), color });
      handleClose();
    }
  }

  function handleClose() {
    dispatch('close');
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
        {mode === 'add' ? 'New Project' : 'Edit Project'}
      </Dialog.Title>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="project-name" class="text-right">Project Name</Label>
        <Input
          id="project-name"
          bind:value={name}
          placeholder="Enter project name"
          class="col-span-3"
          onkeydown={handleKeydown}
        />
      </div>
      <div class="grid grid-cols-4 items-center gap-4">
        <Label for="project-color" class="text-right">Project Color</Label>
        <input
          id="project-color"
          type="color"
          bind:value={color}
          class="col-span-3 h-10 w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={handleClose}>Cancel</Button>
      <Button onclick={handleSave} disabled={!name.trim()}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>