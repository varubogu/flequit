import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectTree } from '$lib/types/project';

const { taskStoreState } = vi.hoisted(() => ({
  taskStoreState: {
    projects: [] as ProjectTree[]
  }
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: taskStoreState
}));

import { ProjectHelpers } from '$lib/services/domain/project/project-helpers';

describe('ProjectHelpers', () => {
  beforeEach(() => {
    taskStoreState.projects = [];
  });

  it('returns 0 when the project does not exist', () => {
    expect(ProjectHelpers.getTaskCountByProjectId('missing')).toBe(0);
  });

  it('sums tasks across every list in the project', () => {
    taskStoreState.projects = [
      {
        id: 'project-1',
        name: 'Alpha',
        orderIndex: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        taskLists: [
          { id: 'list-1', tasks: [{ id: 't1' }, { id: 't2' }] },
          { id: 'list-2', tasks: [{ id: 't3' }] },
          { id: 'list-3', tasks: [] }
        ]
      } as unknown as ProjectTree
    ];

    expect(ProjectHelpers.getTaskCountByProjectId('project-1')).toBe(3);
  });
});
