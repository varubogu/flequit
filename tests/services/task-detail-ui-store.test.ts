/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTaskDetailUiStore, type TaskDetailUiStore } from '$lib/services/ui/task-detail-ui-store.svelte';
import { TaskService } from '$lib/services/domain/task';

vi.mock('$lib/services/domain/task', () => ({
  TaskService: {
    selectTask: vi.fn(),
    selectSubTask: vi.fn()
  }
}));

const mockedTaskService = vi.mocked(TaskService);

describe('TaskDetailUiStore', () => {
  let isMobile: { current: boolean };
  let store: TaskDetailUiStore;

  beforeEach(() => {
    vi.clearAllMocks();
    isMobile = { current: false };
    store = createTaskDetailUiStore({ isMobile });
  });

  it('初期状態ではドロワーが閉じている', () => {
    expect(store.drawerState.open).toBe(false);
  });

  it('closeハンドラを設定できる', () => {
    const handler = vi.fn();
    store.setCloseHandler(handler);

    expect(store.drawerState.onClose).toBe(handler);
  });

  it('デスクトップではタスク選択のみ行いドロワーを開かない', () => {
    store.openTaskDetail('task-1');

    expect(mockedTaskService.selectTask).toHaveBeenCalledWith('task-1');
    expect(store.drawerState.open).toBe(false);
  });

  it('モバイルではタスク選択後にドロワーを開く', () => {
    isMobile.current = true;
    store.openTaskDetail('task-1');

    expect(mockedTaskService.selectTask).toHaveBeenCalledWith('task-1');
    expect(store.drawerState.open).toBe(true);
  });

  it('サブタスク選択時もモバイルならドロワーを開く', () => {
    isMobile.current = true;
    store.openSubTaskDetail('subtask-1');

    expect(mockedTaskService.selectSubTask).toHaveBeenCalledWith('subtask-1');
    expect(store.drawerState.open).toBe(true);
  });

  it('新規タスクの詳細を開くとモバイルでドロワーが開く', () => {
    isMobile.current = true;
    store.openNewTaskDetail();

    expect(store.drawerState.open).toBe(true);
  });

  it('デスクトップではcloseが何もしない', () => {
    store.openTaskDetail('task-1');
    store.closeTaskDetail();

    expect(store.drawerState.open).toBe(false);
  });

  it('モバイルのcloseでハンドラが呼ばれドロワーが閉じる', () => {
    const handler = vi.fn();
    store.setCloseHandler(handler);

    isMobile.current = true;
    store.openTaskDetail('task-1');
    expect(store.drawerState.open).toBe(true);

    store.closeTaskDetail();

    expect(handler).toHaveBeenCalled();
    expect(store.drawerState.open).toBe(false);
  });

  it('モバイルで複数回openしても常に開いた状態を維持する', () => {
    isMobile.current = true;
    store.openTaskDetail('task-1');
    store.openTaskDetail('task-2');

    expect(mockedTaskService.selectTask).toHaveBeenNthCalledWith(1, 'task-1');
    expect(mockedTaskService.selectTask).toHaveBeenNthCalledWith(2, 'task-2');
    expect(store.drawerState.open).toBe(true);
  });
});
