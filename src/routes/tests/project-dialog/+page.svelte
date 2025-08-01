<script lang="ts">
  import ProjectDialog from '$lib/components/project/project-dialog.svelte';
  import Button from '$lib/components/shared/button.svelte';

  let showAddDialog = $state(false);
  let showEditDialog = $state(false);
  let savedData = $state<any>(null);

  function handleSave(data: any) {
    savedData = data;
  }
</script>

<div class="p-4">
  <h1 class="mb-4 text-xl font-bold">ProjectDialog Test Page</h1>

  <div class="mb-4 flex gap-4">
    <Button onclick={() => (showAddDialog = true)} data-testid="open-add-dialog">
      Open Add Dialog
    </Button>
    <Button onclick={() => (showEditDialog = true)} data-testid="open-edit-dialog">
      Open Edit Dialog
    </Button>
  </div>

  {#if savedData}
    <div data-testid="saved-data" class="bg-muted rounded-md border p-4">
      <h2 class="font-semibold">Last Saved Data:</h2>
      <pre>{JSON.stringify(savedData, null, 2)}</pre>
    </div>
  {/if}
</div>

<ProjectDialog
  open={showAddDialog}
  mode="add"
  onsave={handleSave}
  onclose={() => (showAddDialog = false)}
/>

<ProjectDialog
  open={showEditDialog}
  mode="edit"
  initialName="Existing Project"
  initialColor="#ff0000"
  onsave={handleSave}
  onclose={() => (showEditDialog = false)}
/>
