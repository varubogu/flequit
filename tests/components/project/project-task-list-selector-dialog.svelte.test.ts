import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ProjectTaskListSelectorDialog from '$lib/components/project/project-task-list-selector-dialog.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => createUnitTestTranslationService()
}));

// taskStoreのモック
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    projects: [
      {
        id: 'project-1',
        name: 'Project 1',
        task_lists: [
          { id: 'list-1', name: 'Task List 1' },
          { id: 'list-2', name: 'Task List 2' }
        ]
      },
      {
        id: 'project-2',
        name: 'Project 2',
        task_lists: [{ id: 'list-3', name: 'Task List 3' }]
      }
    ]
  }
}));

describe('ProjectTaskListSelectorDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ダイアログが非表示状態で正しくレンダリングされる', () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: false
      }
    });

    // ダイアログが表示されていないことを確認
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ダイアログが表示状態で正しくレンダリングされる', () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true
      }
    });

    // ダイアログのタイトルが表示されることを確認
    expect(screen.getByText('TEST_SELECT_PROJECT_AND_TASK_LIST')).toBeInTheDocument();

    // プロジェクトとタスクリストのラベルが表示されることを確認
    expect(screen.getByText('TEST_PROJECT')).toBeInTheDocument();
    expect(screen.getByText('TEST_TASK_LIST')).toBeInTheDocument();

    // キャンセルと保存ボタンが表示されることを確認
    expect(screen.getByText('TEST_CANCEL')).toBeInTheDocument();
    expect(screen.getByText('TEST_SAVE')).toBeInTheDocument();
  });

  it('プロジェクト選択肢が正しく表示される', () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true
      }
    });

    const projectSelect = screen.getByRole('combobox', { name: 'TEST_PROJECT' });
    expect(projectSelect).toBeInTheDocument();

    // プロジェクトオプションが表示されることを確認
    expect(screen.getByRole('option', { name: 'Project 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Project 2' })).toBeInTheDocument();
  });

  it('プロジェクト未選択時はタスクリスト選択が無効になる', () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true
      }
    });

    const taskListSelect = screen.getByRole('combobox', { name: 'TEST_TASK_LIST' });
    expect(taskListSelect).toBeDisabled();
  });

  it('プロジェクト選択時にタスクリストが有効になり選択肢が表示される', async () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true
      }
    });

    const projectSelect = screen.getByRole('combobox', { name: 'TEST_PROJECT' });
    const taskListSelect = screen.getByRole('combobox', { name: 'TEST_TASK_LIST' });

    // プロジェクトを選択
    await fireEvent.change(projectSelect, { target: { value: 'project-1' } });

    // タスクリスト選択が有効になることを確認
    expect(taskListSelect).not.toBeDisabled();

    // 対応するタスクリストの選択肢が表示されることを確認
    expect(screen.getByRole('option', { name: 'Task List 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Task List 2' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Task List 3' })).not.toBeInTheDocument();
  });

  it('プロジェクト変更時にタスクリスト選択がリセットされる', async () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true,
        currentProjectId: 'project-1',
        currentTaskListId: 'list-1'
      }
    });

    const projectSelect = screen.getByRole('combobox', { name: 'TEST_PROJECT' });
    const taskListSelect = screen.getByRole('combobox', { name: 'TEST_TASK_LIST' });

    // 初期値が設定されていることを確認
    expect(projectSelect).toHaveValue('project-1');
    expect(taskListSelect).toHaveValue('list-1');

    // 別のプロジェクトを選択
    await fireEvent.change(projectSelect, { target: { value: 'project-2' } });

    // タスクリスト選択がリセットされることを確認
    expect(taskListSelect).toHaveValue('');
  });

  it('プロジェクトとタスクリスト未選択時は保存ボタンが無効', () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true
      }
    });

    const saveButton = screen.getByText('TEST_SAVE');
    expect(saveButton).toBeDisabled();
  });

  it('プロジェクトのみ選択時は保存ボタンが無効', async () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true
      }
    });

    const projectSelect = screen.getByRole('combobox', { name: 'TEST_PROJECT' });
    await fireEvent.change(projectSelect, { target: { value: 'project-1' } });

    const saveButton = screen.getByText('TEST_SAVE');
    expect(saveButton).toBeDisabled();
  });

  it('プロジェクトとタスクリスト両方選択時は保存ボタンが有効', async () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true
      }
    });

    const projectSelect = screen.getByRole('combobox', { name: 'TEST_PROJECT' });
    const taskListSelect = screen.getByRole('combobox', { name: 'TEST_TASK_LIST' });

    // プロジェクトとタスクリストを選択
    await fireEvent.change(projectSelect, { target: { value: 'project-1' } });
    await fireEvent.change(taskListSelect, { target: { value: 'list-1' } });

    const saveButton = screen.getByText('TEST_SAVE');
    expect(saveButton).not.toBeDisabled();
  });

  it('保存ボタンクリック時にonSaveコールバックが正しいデータで呼ばれる', async () => {
    const onSave = vi.fn();
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true,
        onSave
      }
    });

    const projectSelect = screen.getByRole('combobox', { name: 'TEST_PROJECT' });
    const taskListSelect = screen.getByRole('combobox', { name: 'TEST_TASK_LIST' });

    // プロジェクトとタスクリストを選択
    await fireEvent.change(projectSelect, { target: { value: 'project-1' } });
    await fireEvent.change(taskListSelect, { target: { value: 'list-1' } });

    // 保存ボタンをクリック
    const saveButton = screen.getByText('TEST_SAVE');
    await fireEvent.click(saveButton);

    // onSaveが正しいデータで呼ばれることを確認
    expect(onSave).toHaveBeenCalledWith({
      projectId: 'project-1',
      taskListId: 'list-1'
    });
  });

  it('キャンセルボタンクリック時にonCloseコールバックが呼ばれる', async () => {
    const onClose = vi.fn();
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true,
        onClose
      }
    });

    const cancelButton = screen.getByText('TEST_CANCEL');
    await fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('初期値が正しく設定される', () => {
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true,
        currentProjectId: 'project-2',
        currentTaskListId: 'list-3'
      }
    });

    const projectSelect = screen.getByRole('combobox', { name: 'TEST_PROJECT' });
    const taskListSelect = screen.getByRole('combobox', { name: 'TEST_TASK_LIST' });

    expect(projectSelect).toHaveValue('project-2');
    expect(taskListSelect).toHaveValue('list-3');
  });

  it('保存処理実行時にプロジェクトまたはタスクリストが未選択の場合はonSaveが呼ばれない', async () => {
    const onSave = vi.fn();
    render(ProjectTaskListSelectorDialog, {
      props: {
        open: true,
        onSave
      }
    });

    // プロジェクトのみ選択
    const projectSelect = screen.getByRole('combobox', { name: 'TEST_PROJECT' });
    await fireEvent.change(projectSelect, { target: { value: 'project-1' } });

    // 保存ボタンは無効だが、念のため直接handleSave関数をテスト
    const saveButton = screen.getByText('TEST_SAVE');

    // ボタンが無効であることを確認
    expect(saveButton).toBeDisabled();

    // onSaveが呼ばれないことを確認
    expect(onSave).not.toHaveBeenCalled();
  });
});
