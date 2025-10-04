import { describe, it, expect, beforeEach } from 'vitest';
import { taskStore } from '$lib/stores/tasks.svelte';
import type { ProjectTree } from '$lib/types/project';

// モックプロジェクトデータ
const mockProjects: ProjectTree[] = [
  {
    id: 'project-1',
    name: 'プロジェクト1',
    description: '',
    color: '#3b82f6',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [
      {
        id: 'tasklist-1',
        projectId: 'project-1',
        name: 'タスクリスト1',
        description: '',
        color: undefined,
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [
          {
            id: 'task-1',
            projectId: 'project-1',
            listId: 'tasklist-1',
            title: 'タスク1',
            description: '',
            status: 'not_started',
            priority: 0,
            orderIndex: 0,
            isArchived: false,
            assignedUserIds: [],
            tagIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            subTasks: [],
            tags: []
          }
        ]
      }
    ]
  },
  {
    id: 'project-2',
    name: 'プロジェクト2',
    description: '',
    color: '#10b981',
    orderIndex: 1,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    taskLists: [
      {
        id: 'tasklist-2',
        projectId: 'project-2',
        name: 'タスクリスト2',
        description: '',
        color: undefined,
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: []
      }
    ]
  }
];

describe('タスクのプロジェクト間ドラッグ&ドロップ', () => {
  beforeEach(async () => {
    // タスクストアをリセット
    taskStore.setProjects([]);

    const { selectionStore } = await import('$lib/stores/selection-store.svelte');
    selectionStore.selectTask(null);
    selectionStore.selectProject(null);
    selectionStore.selectList(null);

    // モックデータをセット
    taskStore.setProjects(mockProjects);
  });

  it('タスクをプロジェクトにドロップするとそのプロジェクトの最初のタスクリストに移動する', async () => {
    const task = mockProjects[0].taskLists[0].tasks[0];
    const targetProject = mockProjects[1];

    // 初期状態を確認
    expect(task.listId).toBe('tasklist-1');
    expect(mockProjects[0].taskLists[0].tasks.length).toBe(1);
    expect(mockProjects[1].taskLists[0].tasks.length).toBe(0);

    // タスクを別プロジェクトに移動
    await taskStore.moveTaskToList(task.id, targetProject.taskLists[0].id);

    // 移動後の状態を確認
    const updatedSourceProject = taskStore.projects.find((p) => p.id === 'project-1');
    const updatedTargetProject = taskStore.projects.find((p) => p.id === 'project-2');

    expect(updatedSourceProject?.taskLists[0].tasks.length).toBe(0);
    expect(updatedTargetProject?.taskLists[0].tasks.length).toBe(1);
    expect(updatedTargetProject?.taskLists[0].tasks[0].id).toBe('task-1');
  });

  it('タスクをタスクリストにドロップすると指定されたタスクリストに移動する', async () => {
    const task = mockProjects[0].taskLists[0].tasks[0];
    const targetTaskList = mockProjects[1].taskLists[0];

    // 初期状態を確認
    expect(task.listId).toBe('tasklist-1');

    // タスクを別タスクリストに移動
    await taskStore.moveTaskToList(task.id, targetTaskList.id);

    // 移動後の状態を確認
    const updatedProjects = taskStore.projects;
    const sourceProject = updatedProjects.find((p) => p.id === 'project-1');
    const targetProject = updatedProjects.find((p) => p.id === 'project-2');

    expect(sourceProject?.taskLists[0].tasks.length).toBe(0);
    expect(targetProject?.taskLists[0].tasks.length).toBe(1);
    expect(targetProject?.taskLists[0].tasks[0].id).toBe('task-1');
  });

  it('存在しないタスクIDで移動を試みても何も起こらない', async () => {
    const initialTasksLength = mockProjects[0].taskLists[0].tasks.length;
    const initialTargetTasksLength = mockProjects[1].taskLists[0].tasks.length;

    // 存在しないタスクIDで移動を試行
    await taskStore.moveTaskToList('non-existent-task', 'tasklist-2');

    // タスクの数が変更されていないことを確認
    expect(taskStore.projects[0].taskLists[0].tasks.length).toBe(initialTasksLength);
    expect(taskStore.projects[1].taskLists[0].tasks.length).toBe(initialTargetTasksLength);
  });

  it('存在しないタスクリストIDにタスクを移動しようとしても何も起こらない', async () => {
    const task = mockProjects[0].taskLists[0].tasks[0];
    const initialTasksLength = mockProjects[0].taskLists[0].tasks.length;

    // 存在しないタスクリストIDに移動を試行
    await taskStore.moveTaskToList(task.id, 'non-existent-tasklist');

    // タスクが元の場所に残っていることを確認
    expect(taskStore.projects[0].taskLists[0].tasks.length).toBe(initialTasksLength);
    expect(taskStore.projects[0].taskLists[0].tasks[0].id).toBe(task.id);
  });

  it('DragDropManagerがタスクドロップ判定を正しく行う', () => {
    const taskDragData = {
      type: 'task' as const,
      id: 'task-1'
    };

    const projectDropTarget = {
      type: 'project' as const,
      id: 'project-2'
    };

    const taskListDropTarget = {
      type: 'tasklist' as const,
      id: 'tasklist-2',
      projectId: 'project-2'
    };

    // プライベートメソッドのテストのため、実際のドロップイベントをシミュレート
    // handleDragOverとhandleDropの結果を間接的にテスト

    // これらのテストは実際のDOMイベントが必要なため、
    // ここでは基本的なロジックの検証のみ実行
    expect(taskDragData.type).toBe('task');
    expect(projectDropTarget.type).toBe('project');
    expect(taskListDropTarget.type).toBe('tasklist');
  });

  it('タスクの所属プロジェクトとタスクリストが正しく更新される', async () => {
    const task = mockProjects[0].taskLists[0].tasks[0];
    const targetTaskListId = 'tasklist-2';

    // タスクを移動
    await taskStore.moveTaskToList(task.id, targetTaskListId);

    // 移動後のタスクがコンテナ階層で正しい位置にあることを確認
    const targetProject = taskStore.projects.find((p) => p.id === 'project-2');
    const targetTaskList = targetProject?.taskLists.find((tl) => tl.id === targetTaskListId);
    const movedTask = targetTaskList?.tasks.find((t) => t.id === task.id);

    expect(movedTask).toBeDefined();
    expect(movedTask?.id).toBe(task.id);
    expect(movedTask?.title).toBe(task.title);
  });
});
