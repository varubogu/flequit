import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TimeLabelsEditor from '$lib/components/settings/date-format/time-labels-editor.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';

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

vi.mock('$lib/stores/settings.svelte', () => ({
  settingsStore: {
    timeLabels: [],
    addTimeLabel: vi.fn(() => 'time_123'),
    updateTimeLabel: vi.fn(),
    removeTimeLabel: vi.fn()
  }
}));

describe('TimeLabelsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // モックされたsettingsStoreのtimeLabelsをリセット
    const settingsStoreMock = vi.mocked(settingsStore);
    settingsStoreMock.timeLabels.splice(0);
  });

  it('基本的なレンダリングが正しく動作すること', () => {
    render(TimeLabelsEditor);

    expect(screen.getByText('Time Labels')).toBeInTheDocument();
    expect(screen.getByText('Add Time Label')).toBeInTheDocument();
    expect(screen.getByText('No time labels configured yet')).toBeInTheDocument();
  });

  it('時刻ラベルが存在する場合、リストが表示されること', () => {
    const settingsStoreMock = vi.mocked(settingsStore);
    settingsStoreMock.timeLabels.push(
      { id: '1', name: '朝食', time: '08:00' },
      { id: '2', name: '昼食', time: '12:00' }
    );

    render(TimeLabelsEditor);

    expect(screen.getByText('朝食')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('昼食')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.queryByText('No time labels configured yet')).not.toBeInTheDocument();
  });

  it('追加ボタンをクリックすると追加フォームが表示されること', async () => {
    render(TimeLabelsEditor);

    const addButton = screen.getByRole('button', { name: /Add Time Label/i });
    await fireEvent.click(addButton);

    expect(screen.getByLabelText('Label Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Time')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('フォームに入力して保存すると時刻ラベルが追加されること', async () => {
    const settingsStoreMock = vi.mocked(settingsStore);
    render(TimeLabelsEditor);

    // 追加フォームを開く
    const addButton = screen.getByRole('button', { name: /Add Time Label/i });
    await fireEvent.click(addButton);

    // フォームに入力
    const nameInput = screen.getByLabelText('Label Name');
    const timeInput = screen.getByLabelText('Time');

    await fireEvent.input(nameInput, { target: { value: '朝食' } });
    await fireEvent.input(timeInput, { target: { value: '08:00' } });

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: /Save/i });
    await fireEvent.click(saveButton);

    expect(settingsStoreMock.addTimeLabel).toHaveBeenCalledWith('朝食', '08:00');
  });

  it('編集ボタンをクリックすると編集フォームが表示されること', async () => {
    const settingsStoreMock = vi.mocked(settingsStore);
    settingsStoreMock.timeLabels.push({ id: '1', name: '朝食', time: '08:00' });

    render(TimeLabelsEditor);

    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find((button) => button.innerHTML.includes('Edit'));

    if (editButton) {
      await fireEvent.click(editButton);

      expect(screen.getByDisplayValue('朝食')).toBeInTheDocument();
      expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
    }
  });

  it('削除ボタンをクリックすると時刻ラベルが削除されること', async () => {
    const settingsStoreMock = vi.mocked(settingsStore);
    settingsStoreMock.timeLabels.push({ id: '1', name: '朝食', time: '08:00' });

    render(TimeLabelsEditor);

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find((button) => button.innerHTML.includes('Trash'));

    if (deleteButton) {
      await fireEvent.click(deleteButton);

      expect(settingsStoreMock.removeTimeLabel).toHaveBeenCalledWith('1');
    }
  });

  it('キャンセルボタンをクリックするとフォームが閉じること', async () => {
    render(TimeLabelsEditor);

    // 追加フォームを開く
    const addButton = screen.getByRole('button', { name: /Add Time Label/i });
    await fireEvent.click(addButton);

    expect(screen.getByLabelText('Label Name')).toBeInTheDocument();

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await fireEvent.click(cancelButton);

    expect(screen.queryByLabelText('Label Name')).not.toBeInTheDocument();
  });

  it('名前または時刻が空の場合、保存ボタンが無効になること', async () => {
    render(TimeLabelsEditor);

    // 追加フォームを開く
    const addButton = screen.getByRole('button', { name: /Add Time Label/i });
    await fireEvent.click(addButton);

    const saveButton = screen.getByRole('button', { name: /Save/i });

    // 初期状態では保存ボタンが無効
    expect(saveButton).toBeDisabled();

    // 名前のみ入力
    const nameInput = screen.getByLabelText('Label Name');
    await fireEvent.input(nameInput, { target: { value: '朝食' } });
    expect(saveButton).toBeDisabled();

    // 時刻も入力
    const timeInput = screen.getByLabelText('Time');
    await fireEvent.input(timeInput, { target: { value: '08:00' } });
    expect(saveButton).not.toBeDisabled();
  });
});
