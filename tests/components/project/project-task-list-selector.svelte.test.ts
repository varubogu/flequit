import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ProjectTaskListSelector from '$lib/components/project/project-task-list-selector.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';

// 翻訳サービスのモック
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: () => createUnitTestTranslationService()
}));

describe('ProjectTaskListSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('projectInfoがnullの場合は何も表示されない', () => {
    render(ProjectTaskListSelector, {
      props: {
        projectInfo: null
      }
    });

    // 要素が表示されないことを確認
    expect(screen.queryByText('TEST_PROJECT')).not.toBeInTheDocument();
    expect(screen.queryByText('TEST_TASK_LIST')).not.toBeInTheDocument();
  });

  it('projectInfoが設定されている場合にプロジェクト情報が表示される', () => {
    const projectInfo = {
      project: { id: 'project-1', name: 'My Project', color: '#ff6b6b' },
      taskList: { id: 'list-1', name: 'To Do' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo
      }
    });

    // プロジェクトラベルとタスクリストラベルが表示されることを確認
    expect(screen.getByText('TEST_PROJECT:')).toBeInTheDocument();
    expect(screen.getByText('TEST_TASK_LIST:')).toBeInTheDocument();

    // プロジェクト名とタスクリスト名が表示されることを確認
    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();

    // 変更ボタンが表示されることを確認
    expect(screen.getByText('TEST_CHANGE')).toBeInTheDocument();
  });

  it('プロジェクトの色が正しく表示される', () => {
    const projectInfo = {
      project: { id: 'project-1', name: 'My Project', color: '#ff6b6b' },
      taskList: { id: 'list-1', name: 'To Do' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo
      }
    });

    // 色インジケーターが正しいスタイルで表示されることを確認
    const colorIndicator = document.querySelector('.h-2.w-2.rounded-full');
    expect(colorIndicator).toBeInTheDocument();
    expect(colorIndicator).toHaveStyle('background-color: #ff6b6b');
  });

  it('プロジェクトの色が未設定の場合はデフォルト色が使用される', () => {
    const projectInfo = {
      project: { id: 'project-1', name: 'My Project' },
      taskList: { id: 'list-1', name: 'To Do' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo
      }
    });

    // デフォルト色（#3b82f6）が使用されることを確認
    const colorIndicator = document.querySelector('.h-2.w-2.rounded-full');
    expect(colorIndicator).toBeInTheDocument();
    expect(colorIndicator).toHaveStyle('background-color: #3b82f6');
  });

  it('変更ボタンクリック時にonEditコールバックが呼ばれる', async () => {
    const onEdit = vi.fn();
    const projectInfo = {
      project: { id: 'project-1', name: 'My Project' },
      taskList: { id: 'list-1', name: 'To Do' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo,
        onEdit
      }
    });

    const changeButton = screen.getByText('TEST_CHANGE');
    await fireEvent.click(changeButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it('onEditコールバックが未設定でも変更ボタンはクリック可能', async () => {
    const projectInfo = {
      project: { id: 'project-1', name: 'My Project' },
      taskList: { id: 'list-1', name: 'To Do' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo
        // onEditを意図的に設定しない
      }
    });

    const changeButton = screen.getByText('TEST_CHANGE');

    // エラーが発生せずにクリックできることを確認
    await expect(fireEvent.click(changeButton)).resolves.not.toThrow();
  });

  it('編集ボタンにEdit3アイコンが表示される', () => {
    const projectInfo = {
      project: { id: 'project-1', name: 'My Project' },
      taskList: { id: 'list-1', name: 'To Do' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo
      }
    });

    // Edit3アイコンが表示されることを確認（lucide-svelteのEdit3コンポーネント）
    const editIcon = document.querySelector('.mr-1.h-4.w-4');
    expect(editIcon).toBeInTheDocument();
  });

  it('プロジェクト情報のレイアウトが正しく表示される', () => {
    const projectInfo = {
      project: { id: 'project-1', name: 'My Project' },
      taskList: { id: 'list-1', name: 'To Do' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo
      }
    });

    // コンテナーが表示されることを確認
    const container = document.querySelector('.bg-muted\\/50.rounded-lg.border.p-4');
    expect(container).toBeInTheDocument();

    // フレックスレイアウトコンテナーが表示されることを確認
    const flexContainer = document.querySelector('.flex.items-center.justify-between');
    expect(flexContainer).toBeInTheDocument();

    // スペースレイアウトが正しく設定されることを確認
    const spaceContainer = document.querySelector('.space-y-2');
    expect(spaceContainer).toBeInTheDocument();
  });

  it('プロジェクト名とタスクリスト名に特殊文字が含まれていても正しく表示される', () => {
    const projectInfo = {
      project: { id: 'project-1', name: 'Project & Task <Management>' },
      taskList: { id: 'list-1', name: '"Important" Tasks' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo
      }
    });

    // 特殊文字を含む名前が正しく表示されることを確認
    expect(screen.getByText('Project & Task <Management>')).toBeInTheDocument();
    expect(screen.getByText('"Important" Tasks')).toBeInTheDocument();
  });

  it('プロジェクト情報の各要素が適切なクラスで表示される', () => {
    const projectInfo = {
      project: { id: 'project-1', name: 'My Project' },
      taskList: { id: 'list-1', name: 'To Do' }
    };

    render(ProjectTaskListSelector, {
      props: {
        projectInfo
      }
    });

    // text-smクラスが適用された要素が存在することを確認
    const textSmElements = document.querySelectorAll('.text-sm');
    expect(textSmElements.length).toBeGreaterThan(0);

    // font-mediumクラスが適用された要素が存在することを確認
    const fontMediumElements = document.querySelectorAll('.font-medium');
    expect(fontMediumElements.length).toBe(3); // プロジェクトとタスクリストのラベル + ボタン
  });
});
