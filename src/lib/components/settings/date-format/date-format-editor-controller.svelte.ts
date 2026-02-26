import { dateTimeFormatStore } from '$lib/stores/datetime-format.svelte';
import { SvelteDate } from 'svelte/reactivity';
import type { EditMode, DuplicateCheckResult } from './types';

export interface DateFormatEditorState {
  testDateTime: SvelteDate;
  testFormat: string;
  testFormatName: string;
  editMode: EditMode;
  editingFormatId: string | null;
  deleteDialogOpen: boolean;
  isInitialized: boolean;
}

export class DateFormatEditorController {
  // State
  testDateTime = $state(new SvelteDate());
  testFormat = $state('');
  testFormatName = $state('');
  editMode = $state<EditMode>('manual');
  editingFormatId = $state<string | null>(null);
  deleteDialogOpen = $state(false);
  isInitialized = $state(false);

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
  initialize(isOpen: boolean) {
    if (isOpen && !this.isInitialized) {
      this.testFormat = dateTimeFormatStore.currentFormat;
      this.testDateTime = new SvelteDate();
      this.testFormatName = '';
      this.editMode = 'manual';
      this.editingFormatId = null;
      this.isInitialized = true;
    } else if (!isOpen) {
      this.isInitialized = false;
    }
  }

  // Event handlers
  handleDateTimeFormatChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dateTimeFormatStore.setCurrentFormat(target.value);
  }

  handleTestFormatChange() {
    if (this.editMode !== 'manual') return;
    const preset = this.allFormats().find((f) => f.format === this.testFormat);
    if (preset?.group === 'カスタムフォーマット') {
      this.testFormatName = preset.name;
    } else {
      this.testFormatName = '';
    }
  }

  handleFormatSelection(selectedId: string) {
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
    this.handleTestFormatChange();
  }

  copyToMain() {
    dateTimeFormatStore.setCurrentFormat(this.testFormat);
  }

  // Mode transitions
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
    // editingFormatId からプリセットを取得してからリセット
    const editingId = this.editingFormatId;
    const preset = editingId ? this.allFormats().find((f) => f.id === editingId) : null;

    this.editMode = 'manual';
    this.editingFormatId = null;

    // 編集中だったフォーマットにリセット
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

  closeDeleteDialog() {
    this.deleteDialogOpen = false;
  }

  // Duplicate check
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
}
