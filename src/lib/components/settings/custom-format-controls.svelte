<script lang="ts">
  import Button from '$lib/components/shared/button.svelte';
  import { reactiveMessage } from '$lib/stores/locale.svelte';
  import * as m from '$paraglide/messages';

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

  const addNewFormat = reactiveMessage(m.add_new);
  const editFormat = reactiveMessage(m.edit);
  const deleteFormat = reactiveMessage(m.delete);
  const saveFormatLabel = reactiveMessage(m.save);
  const cancelEdit = reactiveMessage(m.cancel);
</script>

<div class="flex gap-2 flex-wrap">
  <Button 
    variant="outline" 
    size="sm" 
    onclick={onAdd}
    title={addNewFormat()}
    disabled={!addEnabled}
  >
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
