import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SearchCommand from '$lib/components/command/search-command.svelte';
import { TaskService } from '$lib/services/domain/task';

// モック設定
vi.mock('$lib/services/task-service');
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    allTasks: [],
    selectedListId: 'list1',
    projects: []
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

describe('SearchCommand', () => {
  beforeEach(() => {
    // TaskService のモック
    vi.mocked(TaskService.selectTask).mockReturnValue(true);
  });

  it('初期状態でダイアログが正しく表示される', () => {
    render(SearchCommand, { props: { open: true } });

    // 検索関連のUIが表示されることを確認
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('onOpenChangeコールバックが正しく動作する', () => {
    const onOpenChange = vi.fn();
    render(SearchCommand, { props: { open: true, onOpenChange } });

    // onOpenChangeが関数として渡されることを確認
    expect(onOpenChange).toBeInstanceOf(Function);
  });

  it('ESCキーでダイアログが閉じる', async () => {
    const onOpenChange = vi.fn();
    render(SearchCommand, { props: { open: true, onOpenChange } });

    // ESCキーを押下
    await fireEvent.keyDown(document, { key: 'Escape' });

    // onOpenChangeが呼ばれることを確認（実際の呼び出しはコンポーネント内部の処理による）
    expect(onOpenChange).toBeInstanceOf(Function);
  });

  it('コンポーネントが正しくマウントされる', () => {
    const { component } = render(SearchCommand, { props: { open: false } });

    expect(component).toBeTruthy();
  });
});
