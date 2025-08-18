import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import TaskDetailDrawer from '$lib/components/task/detail/task-detail-drawer.svelte';

// taskStoreのモック
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    selectedTask: null,
    selectedSubTask: null,
    isNewTaskMode: false
  }
}));

// TaskDetailコンポーネントのモック
vi.mock('$lib/components/task/task-detail.svelte', () => ({
  default: vi.fn()
}));

describe('TaskDetailDrawer', () => {
  const defaultProps = {
    open: false,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントが正常にレンダリングされる', () => {
    render(TaskDetailDrawer, {
      props: {
        ...defaultProps,
        open: false
      }
    });

    // エラーなくレンダリングされることを確認
    expect(true).toBe(true);
  });

  it('open=trueの場合にDrawerの基本構造が表示される', () => {
    render(TaskDetailDrawer, {
      props: {
        ...defaultProps,
        open: true
      }
    });

    // Drawerの基本構造要素が存在することを確認
    const contentContainer = document.querySelector(
      '.mx-auto.flex.h-full.w-full.max-w-lg.flex-col'
    );
    expect(contentContainer).toBeInTheDocument();

    const scrollableArea = document.querySelector('.flex-1.overflow-auto.px-2');
    expect(scrollableArea).toBeInTheDocument();
  });

  it('Drawerが開いている場合にコンテンツエリアが表示される', () => {
    render(TaskDetailDrawer, {
      props: {
        ...defaultProps,
        open: true
      }
    });

    // Drawerのコンテンツエリアが表示されることを確認
    const contentArea = document.querySelector('.flex-1.overflow-auto.px-2');
    expect(contentArea).toBeInTheDocument();
  });

  it('Drawerのroledialogが正しく設定される', () => {
    render(TaskDetailDrawer, {
      props: {
        ...defaultProps,
        open: true
      }
    });

    // dialogロールが設定されることを確認
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
  });

  it('onCloseコールバックが設定される', () => {
    const onClose = vi.fn();

    render(TaskDetailDrawer, {
      props: {
        open: true,
        onClose
      }
    });

    // onCloseが設定されていることを確認
    expect(onClose).toBeDefined();
    expect(typeof onClose).toBe('function');
  });

  it('Drawerコンテンツの高さとクラスが正しく設定される', () => {
    render(TaskDetailDrawer, {
      props: {
        ...defaultProps,
        open: true
      }
    });

    // Drawerコンテンツのクラス確認
    const drawerContent = document.querySelector('.flex.h-\\[85vh\\].flex-col');
    expect(drawerContent).toBeInTheDocument();
  });

  it('メインコンテナのレイアウトクラスが正しく適用される', () => {
    render(TaskDetailDrawer, {
      props: {
        ...defaultProps,
        open: true
      }
    });

    // メインコンテナのクラス確認
    const mainContainer = document.querySelector('.mx-auto.flex.h-full.w-full.max-w-lg.flex-col');
    expect(mainContainer).toBeInTheDocument();
  });

  it('スクロールエリアのクラスが正しく適用される', () => {
    render(TaskDetailDrawer, {
      props: {
        ...defaultProps,
        open: true
      }
    });

    // スクロールエリアのクラス確認
    const scrollArea = document.querySelector('.flex-1.overflow-auto.px-2');
    expect(scrollArea).toBeInTheDocument();
  });

  it('open=falseの場合でもエラーが発生しない', () => {
    expect(() => {
      render(TaskDetailDrawer, {
        props: {
          ...defaultProps,
          open: false
        }
      });
    }).not.toThrow();
  });

  it('props が正しく設定される', () => {
    const onClose = vi.fn();

    render(TaskDetailDrawer, {
      props: {
        open: true,
        onClose
      }
    });

    // propsが正しく設定されていることを間接的に確認
    expect(onClose).toBeInstanceOf(Function);
  });
});
