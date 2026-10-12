import { describe, expect, it } from 'vitest';
import { buildProjectUpdate, toProjectResult } from '$lib/stores/project-store-helpers';
import type { ProjectTree } from '$lib/types/project';

const current = {
  id: 'project-1',
  name: 'Alpha',
  description: 'notes',
  color: '#111',
  orderIndex: 2,
  isArchived: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  deleted: false,
  updatedBy: 'user-1',
  taskLists: []
} as ProjectTree;

describe('project store helpers', () => {
  it('keeps current values when an update omits them', () => {
    expect(buildProjectUpdate(current, {})).toEqual({
      name: 'Alpha',
      description: 'notes',
      color: '#111',
      orderIndex: 2,
      isArchived: false
    });
  });

  it('applies each provided field', () => {
    expect(
      buildProjectUpdate(current, {
        name: 'Beta',
        description: 'changed',
        color: '#222',
        order_index: 5,
        is_archived: true
      })
    ).toEqual({
      name: 'Beta',
      description: 'changed',
      color: '#222',
      orderIndex: 5,
      isArchived: true
    });
  });

  it('copies the project fields out of a tree', () => {
    expect(toProjectResult(current)).toEqual({
      id: 'project-1',
      name: 'Alpha',
      description: 'notes',
      color: '#111',
      orderIndex: 2,
      isArchived: false,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
      deleted: false,
      updatedBy: 'user-1'
    });
  });
});
