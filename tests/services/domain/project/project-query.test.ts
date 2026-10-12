import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectTree } from '$lib/types/project';
import type { TaskListWithTasks } from '$lib/types/task-list';

const { taskStoreState } = vi.hoisted(() => ({
  taskStoreState: {
    projects: [] as ProjectTree[],
    selectedProjectId: null as string | null,
    getTaskProjectAndList: vi.fn()
  }
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: taskStoreState
}));

import { ProjectQueryService } from '$lib/services/domain/project/project-query';

function buildList(overrides: Partial<TaskListWithTasks> = {}): TaskListWithTasks {
  return {
    id: 'list-1',
    projectId: 'project-1',
    name: 'Inbox',
    description: 'daily',
    color: '#fff',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    deleted: false,
    updatedBy: 'user-1',
    tasks: [],
    ...overrides
  };
}

function buildProject(overrides: Partial<ProjectTree> = {}): ProjectTree {
  return {
    id: 'project-1',
    name: 'Alpha',
    description: 'First project',
    color: '#111',
    orderIndex: 0,
    isArchived: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    deleted: false,
    updatedBy: 'user-1',
    taskLists: [buildList()],
    ...overrides
  };
}

describe('ProjectQueryService', () => {
  beforeEach(() => {
    taskStoreState.projects = [
      buildProject(),
      buildProject({
        id: 'project-2',
        name: 'Beta Archive',
        description: undefined,
        isArchived: true,
        taskLists: [buildList({ id: 'list-2', projectId: 'project-2' })]
      })
    ];
    taskStoreState.selectedProjectId = 'project-1';
    taskStoreState.getTaskProjectAndList.mockReset();
  });

  it('returns a project by id or name and null when missing', () => {
    expect(ProjectQueryService.getById('project-1')?.name).toBe('Alpha');
    expect(ProjectQueryService.getById('missing')).toBeNull();
    expect(ProjectQueryService.getByName('Beta Archive')?.id).toBe('project-2');
    expect(ProjectQueryService.getByName('missing')).toBeNull();
  });

  it('returns a project with task lists or null', () => {
    const withLists = ProjectQueryService.getWithListsById('project-1');
    expect(withLists?.taskLists).toEqual([
      expect.objectContaining({ id: 'list-1', name: 'Inbox', description: 'daily' })
    ]);
    expect(ProjectQueryService.getWithListsById('missing')).toBeNull();
  });

  it('filters active, archived, and name or description matches', () => {
    expect(ProjectQueryService.getAll()).toHaveLength(2);
    expect(ProjectQueryService.getActive().map((project) => project.id)).toEqual(['project-1']);
    expect(ProjectQueryService.getArchived().map((project) => project.id)).toEqual(['project-2']);

    expect(ProjectQueryService.searchByName('alp').map((project) => project.id)).toEqual(['project-1']);
    expect(ProjectQueryService.searchByName('FIRST').map((project) => project.id)).toEqual([
      'project-1'
    ]);
    expect(ProjectQueryService.searchByName('archive').map((project) => project.id)).toEqual([
      'project-2'
    ]);
    expect(ProjectQueryService.searchByName('nope')).toEqual([]);
  });

  it('reads the selected project id', () => {
    expect(ProjectQueryService.getSelectedProjectId()).toBe('project-1');
    taskStoreState.selectedProjectId = null;
    expect(ProjectQueryService.getSelectedProjectId()).toBeNull();
  });

  it('maps a task lookup and returns null when the task is unknown', () => {
    taskStoreState.getTaskProjectAndList.mockReturnValue({
      project: taskStoreState.projects[0],
      taskList: taskStoreState.projects[0].taskLists[0]
    });

    const found = ProjectQueryService.findProjectAndTaskListByTaskId('task-1');
    expect(found?.project.id).toBe('project-1');
    expect(found?.taskList.id).toBe('list-1');

    taskStoreState.getTaskProjectAndList.mockReturnValue(null);
    expect(ProjectQueryService.findProjectAndTaskListByTaskId('missing')).toBeNull();
  });
});
