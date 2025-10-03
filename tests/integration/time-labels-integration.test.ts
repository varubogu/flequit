import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
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
    settingsStore.timeLabels.splice(0);
    vi.clearAllMocks();
  });

  it('時刻ラベルの完全なCRUD操作が動作すること', async () => {
    render(TimeLabelsEditor);

    // 初期状態：ラベルが存在しない
    expect(screen.getByText('No time labels configured yet')).toBeInTheDocument();

    // 1. 時刻ラベルを追加
    const addButton = screen.getByRole('button', { name: /Add Time Label/i });
    await fireEvent.click(addButton);

    const nameInput = screen.getByLabelText('Label Name');
    const timeInput = screen.getByLabelText('Time');

    await fireEvent.input(nameInput, { target: { value: '朝食' } });
    await fireEvent.input(timeInput, { target: { value: '08:00' } });

    const saveButton = screen.getByRole('button', { name: /Save/i });
    await fireEvent.click(saveButton);

    // 追加されたラベルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('朝食')).toBeInTheDocument();
      expect(screen.getByText('08:00')).toBeInTheDocument();
    });

    // "No time labels"メッセージが表示されないことを確認
    expect(screen.queryByText('No time labels configured yet')).not.toBeInTheDocument();

    // 2. 別の時刻ラベルを追加
    await fireEvent.click(addButton);

    const nameInput2 = screen.getByLabelText('Label Name');
    const timeInput2 = screen.getByLabelText('Time');

    await fireEvent.input(nameInput2, { target: { value: '昼食' } });
    await fireEvent.input(timeInput2, { target: { value: '12:00' } });

    const saveButton2 = screen.getByRole('button', { name: /Save/i });
    await fireEvent.click(saveButton2);

    // 両方のラベルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('朝食')).toBeInTheDocument();
      expect(screen.getByText('昼食')).toBeInTheDocument();
    });

    // 3. 時刻ラベルを編集
    const editButtons = screen.getAllByRole('button');
    const firstEditButton = editButtons.find(
      (button) =>
        button.innerHTML.includes('Edit') && button.closest('div')?.textContent?.includes('朝食')
    );

    if (firstEditButton) {
      await fireEvent.click(firstEditButton);

      const editNameInput = screen.getByDisplayValue('朝食');
      await fireEvent.input(editNameInput, { target: { value: '朝ごはん' } });

      const editSaveButton = screen.getByRole('button', { name: /Save/i });
      await fireEvent.click(editSaveButton);

      // 編集されたラベルが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('朝ごはん')).toBeInTheDocument();
        expect(screen.queryByText('朝食')).not.toBeInTheDocument();
      });
    }

    // 4. 時刻ラベルを削除
    const deleteButtons = screen.getAllByRole('button');
    const firstDeleteButton = deleteButtons.find(
      (button) =>
        button.innerHTML.includes('Trash') && button.closest('div')?.textContent?.includes('昼食')
    );

    if (firstDeleteButton) {
      await fireEvent.click(firstDeleteButton);

      // 削除されたラベルが表示されないことを確認
      await waitFor(() => {
        expect(screen.queryByText('昼食')).not.toBeInTheDocument();
        expect(screen.getByText('朝ごはん')).toBeInTheDocument();
      });
    }
  });

  it('同じ時刻に複数のラベルを設定できること', async () => {
    render(TimeLabelsEditor);

    // 最初のラベル
    const addButton = screen.getByRole('button', { name: /Add Time Label/i });
    await fireEvent.click(addButton);

    let nameInput = screen.getByLabelText('Label Name');
    let timeInput = screen.getByLabelText('Time');

    await fireEvent.input(nameInput, { target: { value: '朝食' } });
    await fireEvent.input(timeInput, { target: { value: '08:00' } });

    let saveButton = screen.getByRole('button', { name: /Save/i });
    await fireEvent.click(saveButton);

    // 同じ時刻の2つ目のラベル
    await fireEvent.click(addButton);

    nameInput = screen.getByLabelText('Label Name');
    timeInput = screen.getByLabelText('Time');

    await fireEvent.input(nameInput, { target: { value: '出勤準備' } });
    await fireEvent.input(timeInput, { target: { value: '08:00' } });

    saveButton = screen.getByRole('button', { name: /Save/i });
    await fireEvent.click(saveButton);

    // 両方のラベルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('朝食')).toBeInTheDocument();
      expect(screen.getByText('出勤準備')).toBeInTheDocument();
      expect(screen.getAllByText('08:00')).toHaveLength(2);
    });

    // settingsStoreで同じ時刻のラベルが取得できることを確認
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
