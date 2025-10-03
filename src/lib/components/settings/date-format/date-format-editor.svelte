<script lang="ts">
  import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';
  import { toast } from 'svelte-sonner';
  import { SvelteDate } from 'svelte/reactivity';
  import DateFormatEditorHeader from './date-format-editor-header.svelte';
  import TestDatetimeSection from './test-datetime-section.svelte';
  import MainDateFormatSection from './main-date-format-section.svelte';
  import FormatCopyButtons from './format-copy-buttons.svelte';
  import TestFormatSection from './test-format-section.svelte';
  import CustomFormatControls from './custom-format-controls.svelte';
  import DeleteFormatDialog from './delete-format-dialog.svelte';

  export type EditMode = 'manual' | 'new' | 'edit';

  export interface DuplicateCheckResult {
    isDuplicate: boolean;
    type?: 'format' | 'name';
    existingName?: string;
    existingFormat?: string;
  }

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  // State
  let testDateTime = $state(new SvelteDate());
  let testFormat = $state('');
  let testFormatName = $state('');
  let editMode = $state<EditMode>('manual');
  let editingFormatId = $state<string | null>(null);
  let deleteDialogOpen = $state(false);
  let isInitialized = $state(false);

  // Derived states
  const currentFormat = $derived(dateTimeFormatStore.currentFormat);
  const allFormats = $derived(dateTimeFormatStore.allFormats);

  const selectedPreset = $derived(() => {
    if (editMode === 'edit' && editingFormatId) {
      return allFormats().find((f) => f.id === editingFormatId) || null;
    }
    if (editMode === 'new') {
      return null;
    }
    if (editMode === 'manual') {
      return allFormats().find((f) => f.format === testFormat) || null;
    }
    return null;
  });

  const formatNameEnabled = $derived(() => editMode === 'new' || editMode === 'edit');
  const addButtonEnabled = $derived(() => editMode === 'manual');
  const editDeleteButtonEnabled = $derived(() => {
    const preset = selectedPreset();
    return editMode === 'manual' && preset?.group === 'カスタムフォーマット';
  });
  const saveButtonEnabled = $derived(
    () =>
      (editMode === 'new' || editMode === 'edit') &&
      !!testFormatName.trim() &&
      !!testFormat.trim()
  );
  const cancelButtonEnabled = $derived(() => editMode === 'new' || editMode === 'edit');

  // Initialization
  function initialize(isOpen: boolean) {
    if (isOpen && !isInitialized) {
      testFormat = dateTimeFormatStore.currentFormat;
      testDateTime = new SvelteDate();
      testFormatName = '';
      editMode = 'manual';
      editingFormatId = null;
      isInitialized = true;
    } else if (!isOpen) {
      isInitialized = false;
    }
  }

  // Sync with open prop changes
  $effect(() => {
    initialize(open);
  });

  // Event handlers
  function handleDateTimeFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dateTimeFormatStore.setCurrentFormat(target.value);
  }

  function handleTestFormatChange(event: Event) {
    if (editMode !== 'manual') return;
    const target = event.target as HTMLInputElement;
    const preset = allFormats().find((f) => f.format === target.value);
    if (preset?.group === 'カスタムフォーマット') {
      testFormatName = preset.name;
    } else {
      testFormatName = '';
    }
  }

  function handleFormatSelection(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedId = target.value;
    if (selectedId === '-10') return; // "Custom" entry
    const selectedFormat = allFormats().find((f) => f.id.toString() === selectedId);
    if (selectedFormat) {
      testFormat = selectedFormat.format;
      if (selectedFormat.group === 'カスタムフォーマット') {
        testFormatName = selectedFormat.name;
      } else {
        testFormatName = '';
      }
    }
  }

  // Copy operations
  function copyToTest() {
    testFormat = currentFormat;
    handleTestFormatChange({ target: { value: currentFormat } } as unknown as Event);
  }

  function copyToMain() {
    dateTimeFormatStore.setCurrentFormat(testFormat);
  }

  // Format management
  function checkDuplicates(
    formatToCheck: string,
    nameToCheck: string,
    excludeId?: string
  ): DuplicateCheckResult {
    const formats = allFormats();
    const filteredFormats = excludeId ? formats.filter((f) => f.id !== excludeId) : formats;
    const duplicateByFormat = filteredFormats.find(
      (f) => f.format === formatToCheck && f.group === 'カスタムフォーマット'
    );
    if (duplicateByFormat) {
      return { isDuplicate: true, type: 'format', existingName: duplicateByFormat.name };
    }
    const duplicateByName = filteredFormats.find(
      (f) => f.name === nameToCheck && f.group === 'カスタムフォーマット'
    );
    if (duplicateByName) {
      return { isDuplicate: true, type: 'name', existingFormat: duplicateByName.format };
    }
    return { isDuplicate: false };
  }

  async function saveFormat() {
    if (testFormatName.trim() && testFormat.trim()) {
      const trimmedName = testFormatName.trim();
      const trimmedFormat = testFormat.trim();
      const duplicateCheck = checkDuplicates(
        trimmedFormat,
        trimmedName,
        editMode === 'edit' ? editingFormatId || undefined : undefined
      );
      if (duplicateCheck.isDuplicate) {
        toast.error(
          `同じ${duplicateCheck.type === 'format' ? 'フォーマット文字列' : 'フォーマット名'}が既に存在します`,
          {
            description: `「${duplicateCheck.type === 'format' ? duplicateCheck.existingName : duplicateCheck.existingFormat}」で既に使用されています`
          }
        );
        return;
      }
      try {
        if (editMode === 'edit' && editingFormatId) {
          await dateTimeFormatStore.updateCustomFormat(editingFormatId, {
            name: trimmedName,
            format: trimmedFormat
          });
          editMode = 'manual';
          editingFormatId = null;
          toast.success('フォーマットを更新しました');
        } else {
          const newId = await dateTimeFormatStore.addCustomFormat(trimmedName, trimmedFormat);
          toast.success('新しいフォーマットを保存しました');
          editMode = 'manual';
          // Select the newly added format
          const newFormat = allFormats().find((f) => f.id === newId);
          if (newFormat) {
            testFormat = newFormat.format;
            testFormatName = newFormat.name;
          }
        }
      } catch (error) {
        console.error('Failed to save format:', error);
        toast.error('保存に失敗しました');
      }
    }
  }

  function startAddMode() {
    editMode = 'new';
    editingFormatId = null;
    testFormatName = '';
    testFormat = '';
  }

  function startEditMode() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      editMode = 'edit';
      editingFormatId = preset.id as string;
      testFormatName = preset.name;
      testFormat = preset.format;
    }
  }

  function cancelEditMode() {
    editMode = 'manual';
    editingFormatId = null;
    // Revert to the format of the currently selected preset
    const preset = selectedPreset();
    if (preset) {
      testFormat = preset.format;
      testFormatName = preset.group === 'カスタムフォーマット' ? preset.name : '';
    }
  }

  function openDeleteDialog() {
    if (selectedPreset()?.group === 'カスタムフォーマット') {
      deleteDialogOpen = true;
    }
  }

  async function deleteCustomFormat() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      try {
        await dateTimeFormatStore.removeCustomFormat(preset.id as string);
        testFormat = '';
        testFormatName = '';
        toast.success('フォーマットを削除しました');
        deleteDialogOpen = false;
      } catch (error) {
        console.error('Failed to delete format:', error);
        toast.error('削除に失敗しました');
        deleteDialogOpen = false;
      }
    }
  }

  function closeDialog() {
    if (editMode !== 'manual') {
      cancelEditMode();
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
        <TestDatetimeSection bind:testDateTime />
        <MainDateFormatSection
          {currentFormat}
          bind:testDateTime
          onFormatChange={handleDateTimeFormatChange}
        />
        <FormatCopyButtons onCopyToTest={copyToTest} onCopyToMain={copyToMain} />
        <TestFormatSection
          bind:testFormat
          bind:testFormatName
          {testDateTime}
          {editMode}
          selectedPreset={selectedPreset()}
          formatNameEnabled={formatNameEnabled()}
          onTestFormatChange={handleTestFormatChange}
          onFormatSelectionChange={handleFormatSelection}
        />
        <CustomFormatControls
          onAdd={startAddMode}
          onEdit={startEditMode}
          onDelete={openDeleteDialog}
          onSave={saveFormat}
          onCancel={cancelEditMode}
          addEnabled={addButtonEnabled()}
          editDeleteEnabled={editDeleteButtonEnabled()}
          saveEnabled={saveButtonEnabled()}
          cancelEnabled={cancelButtonEnabled()}
        />
      </div>
    </div>
  </div>
{/if}

<DeleteFormatDialog bind:open={deleteDialogOpen} onConfirm={deleteCustomFormat} />
