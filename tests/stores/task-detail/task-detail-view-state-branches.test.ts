import { flushSync } from 'svelte';
import { effect_root } from 'svelte/internal/client';
import { afterEach, describe, expect, it } from 'vitest';
import { TaskDetailViewState } from '$lib/stores/task-detail/task-detail-view-state.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';

const task = {
  id: 'task-1',
  projectId: 'project-1',
  listId: 'list-1',
  title: 'Write tests',
  status: 'not_started',
  priority: 0,
  orderIndex: 0,
  isArchived: false,
  assignedUserIds: [],
  tagIds: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  subTasks: [
    {
      id: 'sub-1',
      taskId: 'task-1',
      title: 'Child',
      status: 'not_started',
      orderIndex: 0,
      completed: false,
      assignedUserIds: [],
      tags: [],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    }
  ],
  tags: []
} as TaskWithSubTasks;

const projects = [
  {
    id: 'project-1',
    name: 'Project',
    description: '',
    color: '#000000',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    allTags: [],
    taskLists: [
      {
        id: 'list-1',
        projectId: 'project-1',
        name: 'List',
        description: '',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        tasks: [task]
      }
    ]
  }
] as ProjectTree[];

describe('TaskDetailViewState project context', () => {
  afterEach(() => {
    selectionStore.reset();
    taskStore.setProjects([]);
    taskStore.draft.isNewTaskMode = false;
    taskStore.draft.newTaskDraft = null;
  });

  it('uses the task, the parent task of a subtask, or nothing while drafting', () => {
    taskStore.setProjects(projects);
    let view!: TaskDetailViewState;
    const stop = effect_root(() => {
      view = new TaskDetailViewState();
    });
    flushSync();

    expect(view.currentItem).toBeNull();
    expect(view.projectInfo).toBeNull();

    selectionStore.selectTask('task-1');
    flushSync();
    expect(view.currentItem?.id).toBe('task-1');
    expect(view.projectInfo?.taskList.id).toBe('list-1');
    expect(view.projectInfo?.project.id).toBe('project-1');

    selectionStore.selectSubTask('sub-1');
    flushSync();
    expect(view.isSubTask).toBe(true);
    expect(view.currentItem?.id).toBe('sub-1');
    expect(view.projectInfo?.taskList.id).toBe('list-1');

    selectionStore.selectSubTask(null);
    taskStore.draft.isNewTaskMode = true;
    taskStore.draft.newTaskDraft = { ...task, id: 'draft', title: 'Draft', subTasks: [] };
    flushSync();
    expect(view.currentItem?.title).toBe('Draft');
    expect(view.projectInfo).toBeNull();

    stop();
  });
});
