<script lang="ts">
  import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';
  import type { DateTimeFormat } from '$lib/types/datetime-format';
  import { toast } from 'svelte-sonner';
  import DateFormatEditorHeader from './date-format-editor-header.svelte';
  import TestDatetimeSection from './test-datetime-section.svelte';
  import MainDateFormatSection from './main-date-format-section.svelte';
  import FormatCopyButtons from './format-copy-buttons.svelte';
  import TestFormatSection from './test-format-section.svelte';
  import CustomFormatControls from './custom-format-controls.svelte';
  import DeleteFormatDialog from './delete-format-dialog.svelte';

  interface Props {
    open: boolean;
  }

  let { open = $bindable() }: Props = $props();

  type EditMode = 'manual' | 'new' | 'edit';

  let testDateTime = $state(new Date());
  let testFormat = $state('');
  let testFormatName = $state('');
  let editMode = $state<EditMode>('manual');
  let editingFormatId = $state<string | null>(null);
  let deleteDialogOpen = $state(false);

  let currentFormat = $derived(dateTimeFormatStore.currentFormat);
  const allFormats = $derived(dateTimeFormatStore.allFormats);

  let selectedPreset = $derived(() => {
    if (editMode === 'edit' && editingFormatId) {
      return allFormats().find((f) => f.id === editingFormatId) || null;
    }
    // In 'new' mode, there's no specific preset selected yet.
    if (editMode === 'new') {
      return null;
    }
    // In 'manual' mode, find a preset that matches the current test format.
    if (editMode === 'manual') {
      return allFormats().find((f) => f.format === testFormat) || null;
    }
    return null;
  });

  let formatNameEnabled = $derived(() => editMode === 'new' || editMode === 'edit');
  let addButtonEnabled = $derived(() => editMode === 'manual');
  let editDeleteButtonEnabled = $derived(() => {
    const preset = selectedPreset();
    return editMode === 'manual' && preset?.group === 'カスタムフォーマット';
  });
  let saveButtonEnabled = $derived(() => (editMode === 'new' || editMode === 'edit') && !!testFormatName.trim() && !!testFormat.trim());
  let cancelButtonEnabled = $derived(() => editMode === 'new' || editMode === 'edit');

  let isInitialized = $state(false);
  $effect(() => {
    if (open && !isInitialized) {
      testFormat = dateTimeFormatStore.currentFormat;
      testDateTime = new Date();
      testFormatName = '';
      editMode = 'manual';
      editingFormatId = null;
      isInitialized = true;
    } else if (!open) {
      isInitialized = false;
    }
  });

  function handleDateTimeFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dateTimeFormatStore.setCurrentFormat(target.value);
  }

  function handleTestFormatChange(event: Event) {
    if (editMode !== 'manual') return;
    // When test format is manually changed, find the corresponding preset
    const target = event.target as HTMLInputElement;
    const preset = allFormats().find(f => f.format === target.value);
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

  function copyToTest() {
    testFormat = currentFormat;
    handleTestFormatChange({ target: { value: currentFormat } } as unknown as Event);
  }

  function copyToMain() {
    dateTimeFormatStore.setCurrentFormat(testFormat);
  }

  function checkDuplicates(formatToCheck: string, nameToCheck: string, excludeId?: string) {
    const formats = allFormats();
    const filteredFormats = excludeId ? formats.filter(f => f.id !== excludeId) : formats;
    const duplicateByFormat = filteredFormats.find(f => f.format === formatToCheck && f.group === 'カスタムフォーマット');
    if (duplicateByFormat) {
      return { isDuplicate: true, type: 'format', existingName: duplicateByFormat.name };
    }
    const duplicateByName = filteredFormats.find(f => f.name === nameToCheck && f.group === 'カスタムフォーマット');
    if (duplicateByName) {
      return { isDuplicate: true, type: 'name', existingFormat: duplicateByName.format };
    }
    return { isDuplicate: false };
  }

  function saveFormat() {
    if (testFormatName.trim() && testFormat.trim()) {
      const trimmedName = testFormatName.trim();
      const trimmedFormat = testFormat.trim();
      const duplicateCheck = checkDuplicates(trimmedFormat, trimmedName, editMode === 'edit' ? editingFormatId || undefined : undefined);
      if (duplicateCheck.isDuplicate) {
        toast.error(`同じ${duplicateCheck.type === 'format' ? 'フォーマット文字列' : 'フォーマット名'}が既に存在します`, {
          description: `「${duplicateCheck.type === 'format' ? duplicateCheck.existingName : duplicateCheck.existingFormat}」で既に使用されています`
        });
        return;
      }
      try {
        if (editMode === 'edit' && editingFormatId) {
          dateTimeFormatStore.updateCustomFormat(editingFormatId, { name: trimmedName, format: trimmedFormat });
          editMode = 'manual';
          editingFormatId = null;
          toast.success('フォーマットを更新しました');
        } else {
          const newId = dateTimeFormatStore.addCustomFormat(trimmedName, trimmedFormat);
          toast.success('新しいフォーマットを保存しました');
          editMode = 'manual';
          // Select the newly added format
          const newFormat = allFormats().find(f => f.id === newId);
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

  function deleteCustomFormat() {
    const preset = selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      try {
        dateTimeFormatStore.removeCustomFormat(preset.id as string);
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
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-background p-6 rounded-lg border max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <DateFormatEditorHeader onClose={closeDialog} />

      <div class="space-y-6">
        <TestDatetimeSection bind:testDateTime />
        <MainDateFormatSection bind:currentFormat bind:testDateTime onFormatChange={handleDateTimeFormatChange} />
        <FormatCopyButtons onCopyToTest={copyToTest} onCopyToMain={copyToMain} />
        <TestFormatSection 
          bind:testFormat 
          bind:testFormatName 
          testDateTime={testDateTime}
          editMode={editMode}
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
