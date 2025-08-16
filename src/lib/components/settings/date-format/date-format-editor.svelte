<script lang="ts">
  import DateFormatEditorHeader from './date-format-editor-header.svelte';
  import TestDatetimeSection from './test-datetime-section.svelte';
  import MainDateFormatSection from './main-date-format-section.svelte';
  import FormatCopyButtons from './format-copy-buttons.svelte';
  import TestFormatSection from './test-format-section.svelte';
  import CustomFormatControls from './custom-format-controls.svelte';
  import DeleteFormatDialog from './delete-format-dialog.svelte';
  import { DateFormatEditorLogic } from './date-format-editor-logic.svelte';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  // Initialize logic
  const logic = new DateFormatEditorLogic(() => {
    open = false;
  });

  // Sync with open prop changes
  $effect(() => {
    logic.initialize(open);
  });
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div
      class="bg-background mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border p-6"
    >
      <DateFormatEditorHeader onClose={logic.closeDialog.bind(logic)} />

      <div class="space-y-6">
        <TestDatetimeSection bind:testDateTime={logic.testDateTime} />
        <MainDateFormatSection
          bind:currentFormat={logic.currentFormat}
          bind:testDateTime={logic.testDateTime}
          onFormatChange={logic.handleDateTimeFormatChange.bind(logic)}
        />
        <FormatCopyButtons
          onCopyToTest={logic.copyToTest.bind(logic)}
          onCopyToMain={logic.copyToMain.bind(logic)}
        />
        <TestFormatSection
          bind:testFormat={logic.testFormat}
          bind:testFormatName={logic.testFormatName}
          testDateTime={logic.testDateTime}
          editMode={logic.editMode}
          selectedPreset={logic.selectedPreset()}
          formatNameEnabled={logic.formatNameEnabled()}
          onTestFormatChange={logic.handleTestFormatChange.bind(logic)}
          onFormatSelectionChange={logic.handleFormatSelection.bind(logic)}
        />
        <CustomFormatControls
          onAdd={logic.startAddMode.bind(logic)}
          onEdit={logic.startEditMode.bind(logic)}
          onDelete={logic.openDeleteDialog.bind(logic)}
          onSave={logic.saveFormat.bind(logic)}
          onCancel={logic.cancelEditMode.bind(logic)}
          addEnabled={logic.addButtonEnabled()}
          editDeleteEnabled={logic.editDeleteButtonEnabled()}
          saveEnabled={logic.saveButtonEnabled()}
          cancelEnabled={logic.cancelButtonEnabled()}
        />
      </div>
    </div>
  </div>
{/if}

<DeleteFormatDialog
  bind:open={logic.deleteDialogOpen}
  onConfirm={logic.deleteCustomFormat.bind(logic)}
/>
