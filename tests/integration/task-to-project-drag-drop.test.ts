/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { projectStore } from '$lib/stores/project-store.svelte';
import { taskCoreStore } from '$lib/stores/task-core-store.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { DragDropManager } from '$lib/utils/drag-drop';
import type { ProjectTree } from '$lib/types/project';
import { SvelteSet } from 'svelte/reactivity';

function createMockProjects(): ProjectTree[] {
  const now = () => new Date();
  return [
    {
      id: 'project-1',
      name: 'プロジェクト1',
      description: '',
      color: '#3b82f6',
      orderIndex: 0,
      isArchived: false,
      createdAt: now(),
      updatedAt: now(),
      allTags: [],
      taskLists: [
        {
          id: 'tasklist-1',
          projectId: 'project-1',
          name: 'タスクリスト1',
          description: '',
          color: undefined,
          orderIndex: 0,
          isArchived: false,
          createdAt: now(),
          updatedAt: now(),
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
              createdAt: now(),
              updatedAt: now(),
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
      createdAt: now(),
      updatedAt: now(),
      allTags: [],
      taskLists: [
        {
          id: 'tasklist-2',
          projectId: 'project-2',
          name: 'タスクリスト2',
          description: '',
          color: undefined,
          orderIndex: 0,
          isArchived: false,
          createdAt: now(),
          updatedAt: now(),
          tasks: []
        }
      ]
    }
  ];
}

describe('タスクのプロジェクト間ドラッグ&ドロップ', () => {
  const getProject = (projectId: string) =>
    projectStore.projects.find((project) => project.id === projectId);

  beforeEach(async () => {
    projectStore.reset();
    taskCoreStore.setProjects([]);

    const { selectionStore } = await import('$lib/stores/selection-store.svelte');
    selectionStore.reset();

    tagStore.setTags([]);
    tagStore.bookmarkedTags = new SvelteSet();

    const projects = createMockProjects();
    projectStore.setProjects(projects);
    taskCoreStore.setProjects(projectStore.projects);
  });

  it('タスクをプロジェクトにドロップするとそのプロジェクトの最初のタスクリストに移動する', async () => {
    const sourceProject = getProject('project-1');
    const targetProject = getProject('project-2');
    const task = sourceProject?.taskLists[0].tasks[0];
    const targetTaskList = targetProject?.taskLists[0];

    expect(task).toBeDefined();
    expect(targetTaskList).toBeDefined();

    const moveContext = taskCoreStore.moveTaskBetweenLists(task!.id, targetTaskList!.id);

    expect(moveContext).not.toBeNull();
    expect(moveContext?.targetTaskList.id).toBe(targetTaskList!.id);

    const updatedSourceProject = getProject('project-1');
    const updatedTargetProject = getProject('project-2');

    expect(updatedSourceProject?.taskLists[0].tasks).toHaveLength(0);
    expect(updatedTargetProject?.taskLists[0].tasks).toHaveLength(1);
    expect(updatedTargetProject?.taskLists[0].tasks[0].id).toBe(task!.id);
    expect(updatedTargetProject?.taskLists[0].tasks[0].listId).toBe(targetTaskList!.id);
  });

  it('タスクをタスクリストにドロップすると指定されたタスクリストに移動する', async () => {
    const sourceProject = getProject('project-1');
    const targetProject = getProject('project-2');
    const task = sourceProject?.taskLists[0].tasks[0];
    const targetTaskList = targetProject?.taskLists[0];

    expect(task).toBeDefined();
    expect(targetTaskList).toBeDefined();

    const moveContext = taskCoreStore.moveTaskBetweenLists(task!.id, targetTaskList!.id, {
      targetIndex: 0
    });

    expect(moveContext).not.toBeNull();
    expect(moveContext?.targetIndex).toBe(0);

    const updatedTargetProject = getProject('project-2');
    expect(updatedTargetProject?.taskLists[0].tasks[0].id).toBe(task!.id);
    expect(updatedTargetProject?.taskLists[0].tasks[0].listId).toBe(targetTaskList!.id);
  });

  it('存在しないタスクIDで移動を試みても何も起こらない', async () => {
    const sourceProject = getProject('project-1');
    const targetProject = getProject('project-2');

    const initialSourceTaskCount = sourceProject?.taskLists[0].tasks.length ?? 0;
    const initialTargetTaskCount = targetProject?.taskLists[0].tasks.length ?? 0;

    const moveContext = taskCoreStore.moveTaskBetweenLists('non-existent-task', 'tasklist-2');

    expect(moveContext).toBeNull();
    expect(getProject('project-1')?.taskLists[0].tasks.length).toBe(initialSourceTaskCount);
    expect(getProject('project-2')?.taskLists[0].tasks.length).toBe(initialTargetTaskCount);
  });

  it('存在しないタスクリストIDにタスクを移動しようとしても何も起こらない', async () => {
    const task = getProject('project-1')?.taskLists[0].tasks[0];
    const initialTaskCount = getProject('project-1')?.taskLists[0].tasks.length ?? 0;

    const moveContext = taskCoreStore.moveTaskBetweenLists(task!.id, 'non-existent-tasklist');

    expect(moveContext).toBeNull();
    expect(getProject('project-1')?.taskLists[0].tasks.length).toBe(initialTaskCount);
    expect(getProject('project-1')?.taskLists[0].tasks[0].id).toBe(task!.id);
  });

  it('DragDropManagerがタスクドロップ判定を正しく行う', () => {
    const taskDragData = { type: 'task', id: 'task-1' } as const;

    expect(DragDropManager.canDrop(taskDragData, { type: 'project', id: 'project-2' })).toBe(true);
    expect(
      DragDropManager.canDrop(taskDragData, { type: 'tasklist', id: 'tasklist-2', projectId: 'project-2' })
    ).toBe(true);
    expect(DragDropManager.canDrop(taskDragData, { type: 'task', id: 'task-1' })).toBe(false);
    expect(DragDropManager.canDrop(taskDragData, { type: 'subtask', id: 'subtask-1' })).toBe(false);
  });

  it('タスクの所属プロジェクトとタスクリストが正しく更新される', async () => {
    const sourceTaskList = getProject('project-1')?.taskLists[0];
    const targetTaskList = getProject('project-2')?.taskLists[0];
    const task = sourceTaskList?.tasks[0];

    expect(task).toBeDefined();
    expect(targetTaskList).toBeDefined();

    const moveContext = taskCoreStore.moveTaskBetweenLists(task!.id, targetTaskList!.id);

    expect(moveContext).not.toBeNull();
    const movedTask = getProject('project-2')
      ?.taskLists.find((list) => list.id === targetTaskList!.id)
      ?.tasks.find((t) => t.id === task!.id);

    expect(movedTask).toBeDefined();
    expect(movedTask?.listId).toBe(targetTaskList!.id);
    expect(moveContext?.targetProject.id).toBe(targetTaskList!.projectId);
  });
});
