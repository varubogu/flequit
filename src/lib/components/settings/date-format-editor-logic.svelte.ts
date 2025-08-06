import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';
import { toast } from 'svelte-sonner';
import { SvelteDate } from 'svelte/reactivity';

export type EditMode = 'manual' | 'new' | 'edit';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  type?: 'format' | 'name';
  existingName?: string;
  existingFormat?: string;
}

export class DateFormatEditorLogic {
  // State
  testDateTime = $state(new SvelteDate());
  testFormat = $state('');
  testFormatName = $state('');
  editMode = $state<EditMode>('manual');
  editingFormatId = $state<string | null>(null);
  deleteDialogOpen = $state(false);
  isInitialized = $state(false);

  // Callbacks
  private onClose?: () => void;

  constructor(onClose?: () => void) {
    this.onClose = onClose;
  }

  // Derived states
  currentFormat = $derived(dateTimeFormatStore.currentFormat);
  allFormats = $derived(dateTimeFormatStore.allFormats);

  selectedPreset = $derived(() => {
    if (this.editMode === 'edit' && this.editingFormatId) {
      return this.allFormats().find((f) => f.id === this.editingFormatId) || null;
    }
    if (this.editMode === 'new') {
      return null;
    }
    if (this.editMode === 'manual') {
      return this.allFormats().find((f) => f.format === this.testFormat) || null;
    }
    return null;
  });

  formatNameEnabled = $derived(() => this.editMode === 'new' || this.editMode === 'edit');
  addButtonEnabled = $derived(() => this.editMode === 'manual');
  editDeleteButtonEnabled = $derived(() => {
    const preset = this.selectedPreset();
    return this.editMode === 'manual' && preset?.group === 'カスタムフォーマット';
  });
  saveButtonEnabled = $derived(
    () =>
      (this.editMode === 'new' || this.editMode === 'edit') &&
      !!this.testFormatName.trim() &&
      !!this.testFormat.trim()
  );
  cancelButtonEnabled = $derived(() => this.editMode === 'new' || this.editMode === 'edit');

  // Initialization
  initialize(open: boolean) {
    if (open && !this.isInitialized) {
      this.testFormat = dateTimeFormatStore.currentFormat;
      this.testDateTime = new SvelteDate();
      this.testFormatName = '';
      this.editMode = 'manual';
      this.editingFormatId = null;
      this.isInitialized = true;
    } else if (!open) {
      this.isInitialized = false;
    }
  }

  // Event handlers
  handleDateTimeFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dateTimeFormatStore.setCurrentFormat(target.value);
  }

  handleTestFormatChange(event: Event) {
    if (this.editMode !== 'manual') return;
    const target = event.target as HTMLInputElement;
    const preset = this.allFormats().find((f) => f.format === target.value);
    if (preset?.group === 'カスタムフォーマット') {
      this.testFormatName = preset.name;
    } else {
      this.testFormatName = '';
    }
  }

  handleFormatSelection(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedId = target.value;
    if (selectedId === '-10') return; // "Custom" entry
    const selectedFormat = this.allFormats().find((f) => f.id.toString() === selectedId);
    if (selectedFormat) {
      this.testFormat = selectedFormat.format;
      if (selectedFormat.group === 'カスタムフォーマット') {
        this.testFormatName = selectedFormat.name;
      } else {
        this.testFormatName = '';
      }
    }
  }

  // Copy operations
  copyToTest() {
    this.testFormat = this.currentFormat;
    this.handleTestFormatChange({ target: { value: this.currentFormat } } as unknown as Event);
  }

  copyToMain() {
    dateTimeFormatStore.setCurrentFormat(this.testFormat);
  }

  // Format management
  checkDuplicates(
    formatToCheck: string,
    nameToCheck: string,
    excludeId?: string
  ): DuplicateCheckResult {
    const formats = this.allFormats();
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

  saveFormat() {
    if (this.testFormatName.trim() && this.testFormat.trim()) {
      const trimmedName = this.testFormatName.trim();
      const trimmedFormat = this.testFormat.trim();
      const duplicateCheck = this.checkDuplicates(
        trimmedFormat,
        trimmedName,
        this.editMode === 'edit' ? this.editingFormatId || undefined : undefined
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
        if (this.editMode === 'edit' && this.editingFormatId) {
          dateTimeFormatStore.updateCustomFormat(this.editingFormatId, {
            name: trimmedName,
            format: trimmedFormat
          });
          this.editMode = 'manual';
          this.editingFormatId = null;
          toast.success('フォーマットを更新しました');
        } else {
          const newId = dateTimeFormatStore.addCustomFormat(trimmedName, trimmedFormat);
          toast.success('新しいフォーマットを保存しました');
          this.editMode = 'manual';
          // Select the newly added format
          const newFormat = this.allFormats().find((f) => f.id === newId);
          if (newFormat) {
            this.testFormat = newFormat.format;
            this.testFormatName = newFormat.name;
          }
        }
      } catch (error) {
        console.error('Failed to save format:', error);
        toast.error('保存に失敗しました');
      }
    }
  }

  startAddMode() {
    this.editMode = 'new';
    this.editingFormatId = null;
    this.testFormatName = '';
    this.testFormat = '';
  }

  startEditMode() {
    const preset = this.selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      this.editMode = 'edit';
      this.editingFormatId = preset.id as string;
      this.testFormatName = preset.name;
      this.testFormat = preset.format;
    }
  }

  cancelEditMode() {
    this.editMode = 'manual';
    this.editingFormatId = null;
    // Revert to the format of the currently selected preset
    const preset = this.selectedPreset();
    if (preset) {
      this.testFormat = preset.format;
      this.testFormatName = preset.group === 'カスタムフォーマット' ? preset.name : '';
    }
  }

  openDeleteDialog() {
    if (this.selectedPreset()?.group === 'カスタムフォーマット') {
      this.deleteDialogOpen = true;
    }
  }

  deleteCustomFormat() {
    const preset = this.selectedPreset();
    if (preset?.group === 'カスタムフォーマット') {
      try {
        dateTimeFormatStore.removeCustomFormat(preset.id as string);
        this.testFormat = '';
        this.testFormatName = '';
        toast.success('フォーマットを削除しました');
        this.deleteDialogOpen = false;
      } catch (error) {
        console.error('Failed to delete format:', error);
        toast.error('削除に失敗しました');
        this.deleteDialogOpen = false;
      }
    }
  }

  closeDialog() {
    if (this.editMode !== 'manual') {
      this.cancelEditMode();
    }
    this.onClose?.();
  }
}
