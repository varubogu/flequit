<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { getTranslationService } from '$lib/stores/locale.svelte';

  interface Props {
    onAdd: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onSave: () => void;
    onCancel: () => void;
    addEnabled: boolean;
    editDeleteEnabled: boolean;
    saveEnabled: boolean;
    cancelEnabled: boolean;
  }

  let {
    onAdd,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    addEnabled,
    editDeleteEnabled,
    saveEnabled,
    cancelEnabled
  }: Props = $props();

  const translationService = getTranslationService();
  const addNewFormat = translationService.getMessage('add_new');
  const editFormat = translationService.getMessage('edit');
  const deleteFormat = translationService.getMessage('delete');
  const saveFormatLabel = translationService.getMessage('save');
  const cancelEdit = translationService.getMessage('cancel');
</script>

<div class="flex flex-wrap gap-2">
  <Button variant="outline" size="sm" onclick={onAdd} title={addNewFormat()} disabled={!addEnabled}>
    ➕
  </Button>

  <Button
    variant="outline"
    size="sm"
    onclick={onEdit}
    title={editFormat()}
    disabled={!editDeleteEnabled}
  >
    ✏️
  </Button>

  <Button
    variant="destructive"
    size="sm"
    onclick={onDelete}
    title={deleteFormat()}
    disabled={!editDeleteEnabled}
  >
    🗑️
  </Button>

  <Button
    variant="outline"
    size="sm"
    onclick={onSave}
    title={saveFormatLabel()}
    disabled={!saveEnabled}
  >
    💾
  </Button>

  <Button
    variant="outline"
    size="sm"
    onclick={onCancel}
    title={cancelEdit()}
    disabled={!cancelEnabled}
  >
    ❌
  </Button>
</div>
