import { describe, expect, test, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import TaskDetailDrawer from '$lib/components/task/detail/task-detail-drawer.svelte';
import { taskStore } from '$lib/stores/tasks.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';

vi.mock('$lib/components/task/detail/task-detail.svelte', async () => {
  return import('./task-detail-stub.svelte');
});

vi.mock('$lib/components/ui/drawer', async () => {
  const Root = (await import('./drawer-root-stub.svelte')).default;
  const Content = (await import('./drawer-content-stub.svelte')).default;
  return { Root, Content };
});

const task = {
  id: 'task-1',
  projectId: 'project-1',
  listId: 'list-1',
  title: 'Drawer task',
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

afterEach(() => {
  selectionStore.reset();
  taskStore.setProjects([]);
  taskStore.draft.isNewTaskMode = false;
  taskStore.draft.newTaskDraft = null;
});

describe('TaskDetailDrawer selection', () => {
  test('shows the detail for a task, a subtask, or a new-task draft', () => {
    taskStore.setProjects(projects);

    selectionStore.selectTask('task-1');
    const selected = render(TaskDetailDrawer, { props: { open: false, onClose: vi.fn() } });
    expect(screen.getByText('detail-stub drawer')).toBeInTheDocument();
    selected.unmount();

    selectionStore.selectSubTask('sub-1');
    const subtask = render(TaskDetailDrawer, { props: { open: false, onClose: vi.fn() } });
    expect(screen.getByText('detail-stub drawer')).toBeInTheDocument();
    subtask.unmount();

    selectionStore.reset();
    taskStore.draft.isNewTaskMode = true;
    taskStore.draft.newTaskDraft = { ...task, id: 'draft', title: 'Draft', subTasks: [] };
    const draft = render(TaskDetailDrawer, { props: { open: false, onClose: vi.fn() } });
    expect(screen.getByText('detail-stub drawer')).toBeInTheDocument();
    draft.unmount();
  });

  test('shows the empty message when nothing is selected and the drawer is closed', () => {
    render(TaskDetailDrawer, { props: { open: false, onClose: vi.fn() } });
    expect(screen.getByText('タスクが選択されていません')).toBeInTheDocument();
    expect(screen.queryByText('detail-stub drawer')).not.toBeInTheDocument();
  });

  test('closes only when the drawer reports that it is no longer open', async () => {
    const onClose = vi.fn();
    render(TaskDetailDrawer, { props: { open: true, onClose } });
    expect(screen.getByTestId('drawer-root')).toHaveAttribute('data-open', 'true');
    expect(screen.getByText('detail-stub drawer')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'keep drawer' }));
    expect(onClose).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByRole('button', { name: 'dismiss drawer' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
