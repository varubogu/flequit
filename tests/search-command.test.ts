import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SearchCommand from '$lib/components/search-command.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { viewStore } from '$lib/stores/view-store.svelte';

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
        task_lists: [
          { id: 'list-1', name: 'Default List' }
        ]
      }
    ],
    startNewTaskMode: vi.fn()
  }
}));

vi.mock('$lib/stores/view-store.svelte', () => ({
  viewStore: {
    performSearch: vi.fn(),
    changeView: vi.fn()
  }
}));

vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    selectTask: vi.fn()
  }
}));

vi.mock('$paraglide/messages.js', () => ({
  search_tasks: () => 'Search tasks...',
  show_all_results_for: ({ searchValue }: { searchValue: string }) => `Show all results for "${searchValue}"`,
  search: () => 'Search',
  jump_to_task: () => 'Jump to task',
  results: () => 'Results',
  no_matching_tasks_found: () => 'No matching tasks found',
  show_all_tasks: () => 'Show all tasks',
  quick_actions: () => 'Quick actions',
  add_new_task: () => 'Add new task',
  view_all_tasks: () => 'View all tasks',
  type_a_command: () => 'Type a command...',
  no_commands_found: () => 'No commands found',
  no_tasks_found: () => 'No tasks found',
  commands: () => 'Commands',
  settings: () => 'Settings',
  help: () => 'Help'
}));

vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: () => string) => fn
}));

describe('SearchCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('検索入力時にEnterキーを押すと検索が実行されること', async () => {
    render(SearchCommand, { open: true });
    
    const input = screen.getByRole('combobox');
    await fireEvent.input(input, { target: { value: 'test' } });
    await fireEvent.keyDown(input, { key: 'Enter' });
    
    // 少し待機してから確認
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // viewStore.performSearchが呼ばれることを確認
    expect(viewStore.performSearch).toHaveBeenCalledWith('test');
  });

  it('「すべての結果を表示」項目をクリックすると検索が実行されること', async () => {
    render(SearchCommand, { open: true });
    
    const input = screen.getByRole('combobox');
    await fireEvent.input(input, { target: { value: 'test' } });
    
    // 「すべての結果を表示」項目が表示されることを確認
    const showAllItem = screen.getByText('Show all results for "test"');
    expect(showAllItem).toBeInTheDocument();
    
    // 項目をクリックして選択
    await fireEvent.click(showAllItem);
    
    // viewStore.performSearchが呼ばれることを確認
    expect(viewStore.performSearch).toHaveBeenCalledWith('test');
  });

  it('タスク項目をEnterで選択するとタスクが選択されること', async () => {
    const { TaskService } = await import('$lib/services/task-service');
    
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
    const addTaskItem = screen.getByText('Add new task');
    expect(addTaskItem).toBeInTheDocument();
    
    // 項目をクリック
    await fireEvent.click(addTaskItem);
    
    // startNewTaskModeが適切なlistIdで呼ばれることを確認
    expect(taskStore.startNewTaskMode).toHaveBeenCalledWith('list-1');
  });

  it('「すべてのタスクを表示」をクリックするとchangeViewが呼ばれること', async () => {
    render(SearchCommand, { open: true });
    
    // 入力が空の状態でクイックアクションが表示されることを確認
    const viewAllItem = screen.getByText('View all tasks');
    expect(viewAllItem).toBeInTheDocument();
    
    // 項目をクリック
    await fireEvent.click(viewAllItem);
    
    // changeViewが'all'で呼ばれることを確認
    expect(viewStore.changeView).toHaveBeenCalledWith('all');
  });

  it('クイックアクション実行後にダイアログが閉じること', async () => {
    const onOpenChange = vi.fn();
    render(SearchCommand, { open: true, onOpenChange });
    
    const addTaskItem = screen.getByText('Add new task');
    await fireEvent.click(addTaskItem);
    
    // ダイアログが閉じられることを確認
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('selectedListIdがある場合はそれを使用すること', async () => {
    // selectedListIdをモック
    (taskStore as any).selectedListId = 'selected-list-id';
    
    render(SearchCommand, { open: true });
    
    const addTaskItem = screen.getByText('Add new task');
    await fireEvent.click(addTaskItem);
    
    // selectedListIdが使用されることを確認
    expect(taskStore.startNewTaskMode).toHaveBeenCalledWith('selected-list-id');
  });
});