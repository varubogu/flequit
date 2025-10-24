<script lang="ts">
  import { useTranslation } from '$lib/hooks/use-translation.svelte';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import Button from '$lib/components/shared/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import type { Tag } from '$lib/types/tag';

  interface Props {
    open: boolean;
    tag: Tag | null;
    onsave?: (data: { name: string; color: string }) => void;
    onclose?: () => void;
  }

  let { open = false, tag, onsave, onclose }: Props = $props();

  const translationService = useTranslation();
  // Default color for tags without a color (same as tag-display.svelte)
  const DEFAULT_TAG_COLOR = '#6b7280'; // gray-500

  let name = $state('');
  let color = $state(DEFAULT_TAG_COLOR);

  // Reactiveメッセージ
  const cancel = translationService.getMessage('cancel');
  const save = translationService.getMessage('save');

  $effect(() => {
    if (open && tag) {
      name = tag.name;
      color = tag.color || DEFAULT_TAG_COLOR;
    }
  });

  function handleSave() {
    if (name.trim()) {
      onsave?.({ name: name.trim(), color });
      handleClose();
    }
  }

  function handleClose() {
    onclose?.();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSave();
    } else if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleClose}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>タグの編集</Dialog.Title>
    </Dialog.Header>
    <!-- Preview -->
    <div class="space-y-2">
      <Label>プレビュー</Label>
      <div class="bg-muted/50 rounded-md border p-3">
        <span
          class="inline-block rounded border px-2 py-1 text-xs"
          style="border-color: {color}; color: {color};"
        >
          {name || 'タグ名'}
        </span>
      </div>
    </div>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="tag-name">タグ名</Label>
        <Input
          id="tag-name"
          bind:value={name}
          placeholder="タグ名を入力してください"
          onkeydown={handleKeydown}
        />
      </div>

      <div class="space-y-2">
        <Label for="tag-color">タグ色</Label>
        <div class="flex items-center gap-2">
          <input
            id="tag-color"
            type="color"
            bind:value={color}
            class="border-input h-10 w-12 cursor-pointer rounded border"
          />
          <Input
            bind:value={color}
            placeholder={DEFAULT_TAG_COLOR}
            class="flex-1"
            onkeydown={handleKeydown}
          />
        </div>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={handleClose}>
        {cancel()}
      </Button>
      <Button onclick={handleSave} disabled={!name.trim()}>
        {save()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
