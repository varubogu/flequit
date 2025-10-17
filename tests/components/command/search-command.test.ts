import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SearchCommand from '$lib/components/command/search-command.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { taskInteractions } from '$lib/services/ui/task';
import { viewStore } from '$lib/stores/view-store.svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

// モック設定
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    allTasks: [
      {
        id: '1',
        title: 'Test Task 1',
        description: 'Test description',
        tags: [{ id: 'tag1', name: 'urgent' }]
      },
      {
        id: '2',
        title: 'Another Task',
        description: 'Another description',
        tags: []
      }
    ],
    selectedListId: null,
    projects: [
      {
        id: 'project-1',
        taskLists: [{ id: 'list-1', name: 'Default List' }]
      }
    ]
  }
}));

vi.mock('$lib/services/ui/task', () => ({
  taskInteractions: {
    startNewTaskMode: vi.fn()
  }
}));

vi.mock('$lib/stores/view-store.svelte', () => ({
  viewStore: {
    performSearch: vi.fn(),
    changeView: vi.fn()
  }
}));

vi.mock('$lib/services/domain/task', () => ({
  TaskService: {
    selectTask: vi.fn()
  }
}));

// vitest.setup.tsの統一的なモック化を使用するため、locale.svelteの個別モック化は削除

describe('SearchCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createUnitTestTranslationService());
  });

  it('検索入力時にEnterキーを押すと検索が実行されること', async () => {
    render(SearchCommand, { open: true });

    const input = screen.getByRole('combobox');
    await fireEvent.input(input, { target: { value: 'test' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    // 少し待機してから確認
    await new Promise((resolve) => setTimeout(resolve, 100));

    // viewStore.performSearchが呼ばれることを確認
    expect(viewStore.performSearch).toHaveBeenCalledWith('test');
  });

  it('「すべての結果を表示」項目をクリックすると検索が実行されること', async () => {
    render(SearchCommand, { open: true });

    const input = screen.getByRole('combobox');
    await fireEvent.input(input, { target: { value: 'test' } });

    // 「すべての結果を表示」項目が表示されることを確認
    const showAllItem = screen.getByText(unitTestTranslations.show_all_results_for);
    expect(showAllItem).toBeInTheDocument();

    // 項目をクリックして選択
    await fireEvent.click(showAllItem);

    // viewStore.performSearchが呼ばれることを確認
    expect(viewStore.performSearch).toHaveBeenCalledWith('test');
  });

  it('タスク項目をEnterで選択するとタスクが選択されること', async () => {
    const { TaskService } = await import('$lib/services/domain/task');

    render(SearchCommand, { open: true });

    const input = screen.getByRole('combobox');
    await fireEvent.input(input, { target: { value: 'Test' } });

    // タスク項目が表示されることを確認
    const taskItem = screen.getByText('Test Task 1');
    expect(taskItem).toBeInTheDocument();

    // タスク項目をクリックして選択
    await fireEvent.click(taskItem);

    // TaskService.selectTaskが呼ばれることを確認
    expect(TaskService.selectTask).toHaveBeenCalledWith('1');
  });

  it('Escapeキーでダイアログが閉じること', async () => {
    const onOpenChange = vi.fn();
    render(SearchCommand, { open: true, onOpenChange });

    const input = screen.getByRole('combobox');
    await fireEvent.keyDown(input, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('「新しいタスクを追加」をクリックするとstartNewTaskModeが呼ばれること', async () => {
    render(SearchCommand, { open: true });

    // 入力が空の状態でクイックアクションが表示されることを確認
    const addTaskItem = screen.getByText(unitTestTranslations.add_new_task);
    expect(addTaskItem).toBeInTheDocument();

    // 項目をクリック
    await fireEvent.click(addTaskItem);

    // startNewTaskModeが適切なlistIdで呼ばれることを確認
    expect(taskInteractions.startNewTaskMode).toHaveBeenCalledWith('list-1');
  });

  it('「すべてのタスクを表示」をクリックするとchangeViewが呼ばれること', async () => {
    render(SearchCommand, { open: true });

    // 入力が空の状態でクイックアクションが表示されることを確認
    const viewAllItem = screen.getByText(unitTestTranslations.view_all_tasks);
    expect(viewAllItem).toBeInTheDocument();

    // 項目をクリック
    await fireEvent.click(viewAllItem);

    // changeViewが'all'で呼ばれることを確認
    expect(viewStore.changeView).toHaveBeenCalledWith('all');
  });

  it('クイックアクション実行後にダイアログが閉じること', async () => {
    const onOpenChange = vi.fn();
    render(SearchCommand, { open: true, onOpenChange });

    const addTaskItem = screen.getByText(unitTestTranslations.add_new_task);
    await fireEvent.click(addTaskItem);

    // ダイアログが閉じられることを確認
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('selectedListIdがある場合はそれを使用すること', async () => {
    // selectedListIdをモック
    (taskStore as { selectedListId: string }).selectedListId = 'selected-list-id';

    render(SearchCommand, { open: true });

    const addTaskItem = screen.getByText(unitTestTranslations.add_new_task);
    await fireEvent.click(addTaskItem);

    // selectedListIdが使用されることを確認
    expect(taskInteractions.startNewTaskMode).toHaveBeenCalledWith('selected-list-id');
  });
});
