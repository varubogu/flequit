import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TaskDetailTags from '$lib/components/task/detail/task-detail-tags.svelte';
import { TaskOperations } from '$lib/services/domain/task';
import { subTaskOperations } from '$lib/services/domain/subtask';
import { TaskInteractionsService } from '$lib/services/ui/task/task-interactions';
import { taskStore } from '$lib/stores/tasks.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { SubTask } from '$lib/types/sub-task';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { Tag } from '$lib/types/tag';

const tag: Tag = {
  id: 'tag-1',
  name: 'milk',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
};

const task = {
  id: 'task-1',
  listId: 'list-1',
  title: 'Buy',
  tags: [tag]
} as TaskWithSubTasks;

const subTask = {
  id: 'sub-1',
  taskId: 'task-1',
  title: 'Child',
  tags: []
} as SubTask;

function projectTree(): ProjectTree {
  return {
    id: 'project-1',
    name: 'Home',
    taskLists: [
      {
        id: 'list-1',
        tasks: [
          {
            id: 'task-1',
            subTasks: [{ id: 'sub-1' }]
          }
        ]
      }
    ]
  } as unknown as ProjectTree;
}

async function addTag(name: string) {
  const input = screen.getByRole('textbox');
  await fireEvent.input(input, { target: { value: name } });
  await fireEvent.keyDown(input, { key: 'Enter' });
}

describe('TaskDetailTags', () => {
  beforeEach(() => {
    vi.spyOn(TaskOperations.prototype, 'addTagToTaskByName').mockResolvedValue(undefined);
    vi.spyOn(TaskOperations.prototype, 'removeTagFromTask').mockResolvedValue(undefined);
    vi.spyOn(TaskInteractionsService.prototype, 'addTagToNewTask').mockResolvedValue(undefined);
    vi.spyOn(TaskInteractionsService.prototype, 'removeTagFromNewTask').mockReturnValue(undefined);
    vi.mocked(subTaskOperations.addTagToSubTaskByName).mockReset();
    vi.mocked(subTaskOperations.removeTagFromSubTask).mockReset();
    taskStore.setProjects([]);
    selectionStore.selectProject(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    taskStore.setProjects([]);
    selectionStore.selectProject(null);
  });

  it('renders nothing when neither a task nor a subtask is selected', () => {
    const { container } = render(TaskDetailTags, { props: { task: null, subTask: null } });
    expect(container.textContent?.trim()).toBe('');
  });

  it('adds and removes a tag on the selected task in its project', async () => {
    taskStore.setProjects([projectTree()]);
    render(TaskDetailTags, { props: { task, subTask: null } });

    expect(screen.getByRole('heading', { name: 'tags' })).toBeInTheDocument();
    expect(taskStore.projects.map((project) => project.id)).toEqual(['project-1']);
    expect(taskStore.getProjectIdByTaskId('task-1')).toBe('project-1');

    await addTag('bread');
    expect(TaskOperations.prototype.addTagToTaskByName).toHaveBeenCalledWith('task-1', 'bread');

    await addTag('milk');
    expect(TaskOperations.prototype.addTagToTaskByName).toHaveBeenCalledTimes(1);

    await fireEvent.click(screen.getByRole('button'));
    expect(TaskOperations.prototype.removeTagFromTask).toHaveBeenCalledWith('task-1', 'tag-1');
  });

  it('keeps a task without tags renderable and resolves no project when it is not in the tree', async () => {
    const bare = { id: 'task-2', listId: 'list-2', title: 'Bare' } as TaskWithSubTasks;
    render(TaskDetailTags, { props: { task: bare, subTask: null } });

    expect(screen.getByRole('heading', { name: 'tags' })).toBeInTheDocument();
    await addTag('solo');
    expect(TaskOperations.prototype.addTagToTaskByName).toHaveBeenCalledWith('task-2', 'solo');
    expect(taskStore.getProjectIdByTaskId('task-2')).toBeNull();
  });

  it('routes a new task tag through the draft and uses the selected project', async () => {
    selectionStore.selectProject('project-9');
    render(TaskDetailTags, { props: { task, subTask: null, isNewTaskMode: true } });

    await addTag('draft-tag');
    expect(TaskInteractionsService.prototype.addTagToNewTask).toHaveBeenCalledWith('draft-tag');
    expect(TaskOperations.prototype.addTagToTaskByName).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByRole('button'));
    expect(TaskInteractionsService.prototype.removeTagFromNewTask).toHaveBeenCalledWith('tag-1');
  });

  it('routes a subtask tag through the parent task when the subtask is in the tree', async () => {
    taskStore.setProjects([projectTree()]);
    render(TaskDetailTags, { props: { task: null, subTask } });

    await addTag('nested');
    expect(subTaskOperations.addTagToSubTaskByName).toHaveBeenCalledWith('sub-1', 'task-1', 'nested');
    expect(TaskOperations.prototype.addTagToTaskByName).not.toHaveBeenCalled();
  });

  it('ignores a tag edit when the item is neither a task nor a subtask', async () => {
    render(TaskDetailTags, {
      props: { task: null, subTask: { id: 'orphan', title: 'Loose' } as SubTask }
    });

    await addTag('nowhere');
    expect(TaskOperations.prototype.addTagToTaskByName).not.toHaveBeenCalled();
    expect(subTaskOperations.addTagToSubTaskByName).not.toHaveBeenCalled();
    expect(TaskInteractionsService.prototype.addTagToNewTask).not.toHaveBeenCalled();
  });

  it('does not search projects for a subtask that is not in the tree', () => {
    taskStore.setProjects([projectTree()]);
    const missing = { ...subTask, id: 'missing-sub' };
    render(TaskDetailTags, { props: { task: null, subTask: missing } });
    expect(screen.getByRole('heading', { name: 'tags' })).toBeInTheDocument();
  });
});
