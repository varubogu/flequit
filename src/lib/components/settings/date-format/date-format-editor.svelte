<script lang="ts">
  import DateFormatEditorHeader from './date-format-editor-header.svelte';
  import TestDatetimeSection from './test-datetime-section.svelte';
  import MainDateFormatSection from './main-date-format-section.svelte';
  import FormatCopyButtons from './format-copy-buttons.svelte';
  import TestFormatSection from './test-format-section.svelte';
  import CustomFormatControls from './custom-format-controls.svelte';
  import DeleteFormatDialog from './delete-format-dialog.svelte';
  import { DateFormatEditorController } from './date-format-editor-controller.svelte';
  import { useFormatManagement } from './hooks/use-format-management.svelte';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  // Controller
  const controller = new DateFormatEditorController();
  const { saveFormat, deleteCustomFormat } = useFormatManagement(controller);

  // Sync with open prop changes
  $effect(() => {
    controller.initialize(open);
  });

  // Event handlers
  function handleTestFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    controller.testFormat = target.value;
    controller.handleTestFormatChange();
  }

  function handleFormatSelection(event: Event) {
    const target = event.target as HTMLSelectElement;
    controller.handleFormatSelection(target.value);
  }

  function closeDialog() {
    if (controller.editMode !== 'manual') {
      controller.cancelEditMode();
    }
    open = false;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div
      class="bg-background mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border p-6"
    >
      <DateFormatEditorHeader onClose={closeDialog} />

      <div class="space-y-6">
        <TestDatetimeSection bind:testDateTime={controller.testDateTime} />
        <MainDateFormatSection
          currentFormat={controller.currentFormat}
          bind:testDateTime={controller.testDateTime}
          onFormatChange={controller.handleDateTimeFormatChange.bind(controller)}
        />
        <FormatCopyButtons
          onCopyToTest={controller.copyToTest.bind(controller)}
          onCopyToMain={controller.copyToMain.bind(controller)}
        />
        <TestFormatSection
          bind:testFormat={controller.testFormat}
          bind:testFormatName={controller.testFormatName}
          testDateTime={controller.testDateTime}
          editMode={controller.editMode}
          selectedPreset={controller.selectedPreset()}
          formatNameEnabled={controller.formatNameEnabled()}
          onTestFormatChange={handleTestFormatChange}
          onFormatSelectionChange={handleFormatSelection}
        />
        <CustomFormatControls
          onAdd={controller.startAddMode.bind(controller)}
          onEdit={controller.startEditMode.bind(controller)}
          onDelete={controller.openDeleteDialog.bind(controller)}
          onSave={saveFormat}
          onCancel={controller.cancelEditMode.bind(controller)}
          addEnabled={controller.addButtonEnabled()}
          editDeleteEnabled={controller.editDeleteButtonEnabled()}
          saveEnabled={controller.saveButtonEnabled()}
          cancelEnabled={controller.cancelButtonEnabled()}
        />
      </div>
    </div>
  </div>
{/if}

<DeleteFormatDialog bind:open={controller.deleteDialogOpen} onConfirm={deleteCustomFormat} />
