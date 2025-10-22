import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import TimeLabelsEditor from '$lib/components/settings/date-format/time-labels-editor.svelte';
import type { TimeLabel } from '$lib/types/settings';

// バックエンドサービスをモック化
vi.mock('$lib/infrastructure/backends', () => ({
  getBackendService: vi.fn(() =>
    Promise.resolve({
      setting: {
        get: vi.fn(() => Promise.resolve(null)),
        getAll: vi.fn(() => Promise.resolve([])),
        update: vi.fn(() => Promise.resolve(true))
      },
      settingsManagement: {
        loadSettings: vi.fn(() => Promise.resolve(null)),
        saveSettings: vi.fn(() => Promise.resolve(true)),
        settingsFileExists: vi.fn(() => Promise.resolve(false)),
        initializeSettingsWithDefaults: vi.fn(() => Promise.resolve(true)),
        getSettingsFilePath: vi.fn(() => Promise.resolve('/tmp/settings.json')),
        updateSettingsPartially: vi.fn(() => Promise.resolve(null)),
        addCustomDueDay: vi.fn(() => Promise.resolve(true))
      }
    })
  )
}));

// モック化
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: vi.fn((key: string) => () => {
      const messages: Record<string, string> = {
        time_labels: 'Time Labels',
        add_time_label: 'Add Time Label',
        time_label_name: 'Label Name',
        time_label_time: 'Time',
        no_time_labels: 'No time labels configured yet',
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        cancel: 'Cancel',
        save: 'Save'
      };
      return messages[key] || key;
    })
  }))
}));

describe('TimeLabels Integration Tests', () => {
  beforeEach(() => {
    // LocalStorageをモック化
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    // settingsStoreの状態をリセット
    const existingLabels = [...settingsStore.timeLabels];
    existingLabels.forEach((label) => settingsStore.removeTimeLabel(label.id));
    vi.clearAllMocks();
  });

  it('時刻ラベルの完全なCRUD操作が動作すること', async () => {
    let view = render(TimeLabelsEditor);
    const rerender = () => {
      view.unmount();
      view = render(TimeLabelsEditor);
    };

    const addTimeLabelThroughUI = async (name: string, time: string) => {
      const addButton = screen.getByRole('button', { name: /Add Time Label/i });
      await fireEvent.click(addButton);

      const nameInput = screen.getByLabelText('Label Name');
      const timeInput = screen.getByLabelText('Time');

      await fireEvent.input(nameInput, { target: { value: name } });
      await fireEvent.input(timeInput, { target: { value: time } });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      expect(saveButton).not.toBeDisabled();
      await fireEvent.click(saveButton);
      await tick();
    };

    const getActionButton = (labelText: string, index: number) => {
      const labelElement = screen.getByText(labelText);
      const card = labelElement.parentElement?.parentElement as HTMLElement | null;
      if (!card) {
        throw new Error(`Card for label "${labelText}" not found`);
      }
      const buttons = within(card).getAllByRole('button');
      return buttons[index];
    };

    // 初期状態：ラベルが存在しない
    expect(screen.getByText('No time labels configured yet')).toBeInTheDocument();

    // 1. 時刻ラベルを追加
    await addTimeLabelThroughUI('朝食', '08:00');
    await waitFor(() => {
      expect(settingsStore.timeLabels).toHaveLength(1);
      expect(settingsStore.timeLabels[0]?.name).toBe('朝食');
    });
    rerender();

    await waitFor(() => {
      expect(screen.getByText('朝食')).toBeInTheDocument();
      expect(screen.getByText('08:00')).toBeInTheDocument();
    });
    expect(screen.queryByText('No time labels configured yet')).not.toBeInTheDocument();

    // 2. 別の時刻ラベルを追加
    await addTimeLabelThroughUI('昼食', '12:00');
    await waitFor(() => {
      expect(settingsStore.timeLabels).toHaveLength(2);
    });
    rerender();

    await waitFor(() => {
      expect(screen.getByText('朝食')).toBeInTheDocument();
      expect(screen.getByText('昼食')).toBeInTheDocument();
    });

    // 3. 時刻ラベルを編集
    const editButton = getActionButton('朝食', 0);
    await fireEvent.click(editButton);

    const editNameInput = screen.getByDisplayValue('朝食');
    await fireEvent.input(editNameInput, { target: { value: '朝ごはん' } });

    const editSaveButton = screen.getByRole('button', { name: /Save/i });
    expect(editSaveButton).not.toBeDisabled();
    await fireEvent.click(editSaveButton);
    await tick();
    rerender();

    await waitFor(() => {
      expect(screen.getByText('朝ごはん')).toBeInTheDocument();
      expect(screen.queryByText('朝食')).not.toBeInTheDocument();
    });

    // 4. 時刻ラベルを削除
    const deleteButton = getActionButton('昼食', 1);
    await fireEvent.click(deleteButton);
    await tick();
    rerender();

    await waitFor(() => {
      expect(screen.queryByText('昼食')).not.toBeInTheDocument();
      expect(screen.getByText('朝ごはん')).toBeInTheDocument();
    });
  });

  it('同じ時刻に複数のラベルを設定できること', async () => {
    let view = render(TimeLabelsEditor);
    const rerender = () => {
      view.unmount();
      view = render(TimeLabelsEditor);
    };

    const addLabel = async (name: string) => {
      const addButton = screen.getByRole('button', { name: /Add Time Label/i });
      await fireEvent.click(addButton);

      const nameInput = screen.getByLabelText('Label Name');
      const timeInput = screen.getByLabelText('Time');

      await fireEvent.input(nameInput, { target: { value: name } });
      await fireEvent.input(timeInput, { target: { value: '08:00' } });

      const saveButton = screen.getByRole('button', { name: /Save/i });
      expect(saveButton).not.toBeDisabled();
      await fireEvent.click(saveButton);
      await tick();
    };

    await addLabel('朝食');
    await waitFor(() => {
      const labels = settingsStore.timeLabels.filter((label) => label.time === '08:00');
      expect(labels).toHaveLength(1);
    });
    rerender();

    await addLabel('出勤準備');
    await waitFor(() => {
      const labels = settingsStore.timeLabels.filter((label) => label.time === '08:00');
      expect(labels).toHaveLength(2);
    });
    rerender();

    await waitFor(() => {
      expect(screen.getByText('朝食')).toBeInTheDocument();
      expect(screen.getByText('出勤準備')).toBeInTheDocument();
      expect(screen.getAllByText('08:00')).toHaveLength(2);
    });

    const timeLabels = settingsStore.getTimeLabelsByTime('08:00');
    expect(timeLabels).toHaveLength(2);
    expect(timeLabels.map((t: TimeLabel) => t.name)).toEqual(['朝食', '出勤準備']);
  });

  it('フォームバリデーションが正しく動作すること', async () => {
    render(TimeLabelsEditor);

    const addButton = screen.getByRole('button', { name: /Add Time Label/i });
    await fireEvent.click(addButton);

    const saveButton = screen.getByRole('button', { name: /Save/i });

    // 初期状態では保存ボタンが無効
    expect(saveButton).toBeDisabled();

    // 名前のみ入力（時刻が空）
    const nameInput = screen.getByLabelText('Label Name');
    await fireEvent.input(nameInput, { target: { value: '朝食' } });
    expect(saveButton).toBeDisabled();

    // 名前をクリア、時刻のみ入力
    await fireEvent.input(nameInput, { target: { value: '' } });
    const timeInput = screen.getByLabelText('Time');
    await fireEvent.input(timeInput, { target: { value: '08:00' } });
    expect(saveButton).toBeDisabled();

    // 両方入力すると有効になる
    await fireEvent.input(nameInput, { target: { value: '朝食' } });
    expect(saveButton).not.toBeDisabled();

    // 無効な時刻フォーマット
    await fireEvent.input(timeInput, { target: { value: '25:00' } });
    expect(saveButton).toBeDisabled();

    await fireEvent.input(timeInput, { target: { value: '08:60' } });
    expect(saveButton).toBeDisabled();

    // 有効な時刻フォーマットに戻す
    await fireEvent.input(timeInput, { target: { value: '08:00' } });
    expect(saveButton).not.toBeDisabled();
  });
});
