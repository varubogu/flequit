<script lang="ts">
  import ProjectDialog from '$lib/components/project-dialog.svelte';
  import Button from '$lib/components/ui/button.svelte';

  let showAddDialog = $state(false);
  let showEditDialog = $state(false);
  let savedData = $state<any>(null);

  function handleSave(data: any) {
    savedData = data;
  }
</script>

<div class="p-4">
  <h1 class="text-xl font-bold mb-4">ProjectDialog Test Page</h1>

  <div class="flex gap-4 mb-4">
    <Button onclick={() => showAddDialog = true} data-testid="open-add-dialog">
      Open Add Dialog
    </Button>
    <Button onclick={() => showEditDialog = true} data-testid="open-edit-dialog">
      Open Edit Dialog
    </Button>
  </div>

  {#if savedData}
    <div data-testid="saved-data" class="p-4 border rounded-md bg-muted">
      <h2 class="font-semibold">Last Saved Data:</h2>
      <pre>{JSON.stringify(savedData, null, 2)}</pre>
    </div>
  {/if}
</div>

<ProjectDialog
  open={showAddDialog}
  mode="add"
  onsave={handleSave}
  onclose={() => showAddDialog = false}
/>

<ProjectDialog
  open={showEditDialog}
  mode="edit"
  initialName="Existing Project"
  initialColor="#ff0000"
  onsave={handleSave}
  onclose={() => showEditDialog = false}
/>
