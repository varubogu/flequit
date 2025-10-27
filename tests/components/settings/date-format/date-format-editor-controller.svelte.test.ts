import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DateFormatEditorController } from '$lib/components/settings/date-format/date-format-editor-controller.svelte';
import type { DateTimeFormat } from '$lib/types/datetime-format';

// Store のモック
const mockFormats: DateTimeFormat[] = [
  { id: '1', name: 'ISO Date', format: 'yyyy-MM-dd', group: 'プリセット', order: 0 },
  { id: '2', name: 'Custom Format', format: 'dd/MM/yyyy', group: 'カスタムフォーマット', order: 1 },
  { id: '3', name: 'Another Custom', format: 'MM/dd/yyyy', group: 'カスタムフォーマット', order: 2 }
];

vi.mock('$lib/stores/datetime-format.svelte', () => ({
  dateTimeFormatStore: {
    currentFormat: 'yyyy-MM-dd',
    allFormats: vi.fn(() => mockFormats),
    setCurrentFormat: vi.fn(),
    addCustomFormat: vi.fn(() => Promise.resolve('new-id')),
    updateCustomFormat: vi.fn(() => Promise.resolve()),
    removeCustomFormat: vi.fn(() => Promise.resolve())
  }
}));

describe('DateFormatEditorController', () => {
  let controller: DateFormatEditorController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new DateFormatEditorController();
  });

  describe('初期化', () => {
    it('初期状態が正しく設定される', () => {
      expect(controller.testFormat).toBe('');
      expect(controller.testFormatName).toBe('');
      expect(controller.editMode).toBe('manual');
      expect(controller.editingFormatId).toBe(null);
      expect(controller.deleteDialogOpen).toBe(false);
      expect(controller.isInitialized).toBe(false);
    });

    it('initialize(true)で状態が初期化される', () => {
      controller.initialize(true);

      expect(controller.testFormat).toBe('yyyy-MM-dd');
      expect(controller.testFormatName).toBe('');
      expect(controller.editMode).toBe('manual');
      expect(controller.editingFormatId).toBe(null);
      expect(controller.isInitialized).toBe(true);
    });

    it('initialize(false)で初期化フラグがリセットされる', () => {
      controller.initialize(true);
      expect(controller.isInitialized).toBe(true);

      controller.initialize(false);
      expect(controller.isInitialized).toBe(false);
    });

    it('既に初期化済みの場合は再初期化しない', () => {
      controller.initialize(true);
      controller.testFormat = 'custom-format';

      controller.initialize(true);
      expect(controller.testFormat).toBe('custom-format'); // 変更されない
    });
  });

  describe('selectedPreset', () => {
    beforeEach(() => {
      controller.initialize(true);
    });

    it('manual モードでフォーマットに一致するプリセットを返す', () => {
      controller.editMode = 'manual';
      controller.testFormat = 'dd/MM/yyyy';

      const preset = controller.selectedPreset();
      expect(preset).toEqual(mockFormats[1]);
    });

    it('edit モードで編集中のフォーマットを返す', () => {
      controller.editMode = 'edit';
      controller.editingFormatId = '2';

      const preset = controller.selectedPreset();
      expect(preset).toEqual(mockFormats[1]);
    });

    it('new モードでは null を返す', () => {
      controller.editMode = 'new';

      const preset = controller.selectedPreset();
      expect(preset).toBe(null);
    });

    it('一致するフォーマットがない場合は null を返す', () => {
      controller.editMode = 'manual';
      controller.testFormat = 'non-existent-format';

      const preset = controller.selectedPreset();
      expect(preset).toBe(null);
    });
  });

  describe('Derived states', () => {
    beforeEach(() => {
      controller.initialize(true);
    });

    it('formatNameEnabled は new/edit モードで true', () => {
      controller.editMode = 'manual';
      expect(controller.formatNameEnabled()).toBe(false);

      controller.editMode = 'new';
      expect(controller.formatNameEnabled()).toBe(true);

      controller.editMode = 'edit';
      expect(controller.formatNameEnabled()).toBe(true);
    });

    it('addButtonEnabled は manual モードで true', () => {
      controller.editMode = 'manual';
      expect(controller.addButtonEnabled()).toBe(true);

      controller.editMode = 'new';
      expect(controller.addButtonEnabled()).toBe(false);
    });

    it('editDeleteButtonEnabled はカスタムフォーマット選択時のみ true', () => {
      controller.editMode = 'manual';
      controller.testFormat = 'yyyy-MM-dd'; // プリセット
      expect(controller.editDeleteButtonEnabled()).toBe(false);

      controller.testFormat = 'dd/MM/yyyy'; // カスタム
      expect(controller.editDeleteButtonEnabled()).toBe(true);
    });

    it('saveButtonEnabled は new/edit モードで名前とフォーマットがある時 true', () => {
      controller.editMode = 'new';
      controller.testFormat = '';
      controller.testFormatName = '';
      expect(controller.saveButtonEnabled()).toBe(false);

      controller.testFormat = 'yyyy-MM-dd';
      expect(controller.saveButtonEnabled()).toBe(false);

      controller.testFormatName = 'Test Format';
      expect(controller.saveButtonEnabled()).toBe(true);
    });

    it('cancelButtonEnabled は new/edit モードで true', () => {
      controller.editMode = 'manual';
      expect(controller.cancelButtonEnabled()).toBe(false);

      controller.editMode = 'new';
      expect(controller.cancelButtonEnabled()).toBe(true);

      controller.editMode = 'edit';
      expect(controller.cancelButtonEnabled()).toBe(true);
    });
  });

  describe('イベントハンドラ', () => {
    beforeEach(() => {
      controller.initialize(true);
    });

    it('handleTestFormatChange でカスタムフォーマット名が設定される', () => {
      controller.editMode = 'manual';
      controller.testFormat = 'dd/MM/yyyy';

      controller.handleTestFormatChange();

      expect(controller.testFormatName).toBe('Custom Format');
    });

    it('handleTestFormatChange でプリセットの場合は名前がクリアされる', () => {
      controller.editMode = 'manual';
      controller.testFormat = 'yyyy-MM-dd';
      controller.testFormatName = 'Previous Name';

      controller.handleTestFormatChange();

      expect(controller.testFormatName).toBe('');
    });

    it('handleTestFormatChange は manual モード以外では動作しない', () => {
      controller.editMode = 'new';
      controller.testFormat = 'dd/MM/yyyy';

      controller.handleTestFormatChange();

      expect(controller.testFormatName).toBe(''); // 変更されない
    });

    it('handleFormatSelection でフォーマットと名前が設定される', () => {
      controller.handleFormatSelection('2');

      expect(controller.testFormat).toBe('dd/MM/yyyy');
      expect(controller.testFormatName).toBe('Custom Format');
    });

    it('handleFormatSelection で -10 は無視される', () => {
      const prevFormat = controller.testFormat;
      controller.handleFormatSelection('-10');

      expect(controller.testFormat).toBe(prevFormat);
    });

    it('handleFormatSelection で存在しないIDは無視される', () => {
      const prevFormat = controller.testFormat;
      controller.handleFormatSelection('999');

      expect(controller.testFormat).toBe(prevFormat);
    });
  });

  describe('コピー操作', () => {
    beforeEach(() => {
      controller.initialize(true);
    });

    it('copyToTest で現在のフォーマットがテストにコピーされる', () => {
      controller.copyToTest();

      expect(controller.testFormat).toBe('yyyy-MM-dd');
    });

    it('copyToMain でテストフォーマットがメインに設定される', async () => {
      const { dateTimeFormatStore } = await import('$lib/stores/datetime-format.svelte');
      controller.testFormat = 'dd/MM/yyyy';

      controller.copyToMain();

      expect(dateTimeFormatStore.setCurrentFormat).toHaveBeenCalledWith('dd/MM/yyyy');
    });
  });

  describe('モード遷移', () => {
    beforeEach(() => {
      controller.initialize(true);
    });

    it('startAddMode で新規追加モードになる', () => {
      controller.startAddMode();

      expect(controller.editMode).toBe('new');
      expect(controller.editingFormatId).toBe(null);
      expect(controller.testFormatName).toBe('');
      expect(controller.testFormat).toBe('');
    });

    it('startEditMode でカスタムフォーマットの編集モードになる', () => {
      controller.testFormat = 'dd/MM/yyyy';

      controller.startEditMode();

      expect(controller.editMode).toBe('edit');
      expect(controller.editingFormatId).toBe('2');
      expect(controller.testFormatName).toBe('Custom Format');
      expect(controller.testFormat).toBe('dd/MM/yyyy');
    });

    it('startEditMode でプリセットは編集できない', () => {
      controller.testFormat = 'yyyy-MM-dd';

      controller.startEditMode();

      expect(controller.editMode).toBe('manual'); // 変更されない
    });

    it('cancelEditMode で manual モードに戻る', () => {
      controller.editMode = 'new';
      controller.testFormat = 'test-format';

      controller.cancelEditMode();

      expect(controller.editMode).toBe('manual');
      expect(controller.editingFormatId).toBe(null);
    });

    it('cancelEditMode で選択中のプリセットにリセットされる', () => {
      controller.testFormat = 'dd/MM/yyyy';
      controller.editMode = 'edit';
      controller.editingFormatId = '2';
      controller.testFormat = 'modified-format';

      controller.cancelEditMode();

      expect(controller.testFormat).toBe('dd/MM/yyyy');
      expect(controller.testFormatName).toBe('Custom Format');
    });
  });

  describe('削除ダイアログ', () => {
    beforeEach(() => {
      controller.initialize(true);
    });

    it('openDeleteDialog でカスタムフォーマットの削除ダイアログが開く', () => {
      controller.testFormat = 'dd/MM/yyyy';

      controller.openDeleteDialog();

      expect(controller.deleteDialogOpen).toBe(true);
    });

    it('openDeleteDialog でプリセットは削除ダイアログが開かない', () => {
      controller.testFormat = 'yyyy-MM-dd';

      controller.openDeleteDialog();

      expect(controller.deleteDialogOpen).toBe(false);
    });

    it('closeDeleteDialog でダイアログが閉じる', () => {
      controller.deleteDialogOpen = true;

      controller.closeDeleteDialog();

      expect(controller.deleteDialogOpen).toBe(false);
    });
  });

  describe('重複チェック', () => {
    beforeEach(() => {
      controller.initialize(true);
    });

    it('重複するフォーマットを検出する', () => {
      const result = controller.checkDuplicates('dd/MM/yyyy', 'New Name');

      expect(result.isDuplicate).toBe(true);
      expect(result.type).toBe('format');
      expect(result.existingName).toBe('Custom Format');
    });

    it('重複する名前を検出する', () => {
      const result = controller.checkDuplicates('new-format', 'Custom Format');

      expect(result.isDuplicate).toBe(true);
      expect(result.type).toBe('name');
      expect(result.existingFormat).toBe('dd/MM/yyyy');
    });

    it('重複がない場合は isDuplicate が false', () => {
      const result = controller.checkDuplicates('new-format', 'New Name');

      expect(result.isDuplicate).toBe(false);
      expect(result.type).toBeUndefined();
    });

    it('excludeId で指定したIDは重複チェックから除外される', () => {
      const result = controller.checkDuplicates('dd/MM/yyyy', 'Custom Format', '2');

      expect(result.isDuplicate).toBe(false);
    });

    it('プリセットフォーマットは重複としてカウントされない', () => {
      const result = controller.checkDuplicates('yyyy-MM-dd', 'New Name');

      expect(result.isDuplicate).toBe(false);
    });
  });
});
