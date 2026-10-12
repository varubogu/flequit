import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/svelte';
import TaskDescriptionEditor from '$lib/components/task/editors/task-description-editor.svelte';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { SubTask } from '$lib/types/sub-task';
import type { ProjectTree } from '$lib/types/project';
import type { Tag } from '$lib/types/tag';
import { taskStore } from '$lib/stores/tasks.svelte';
import { selectionStore } from '$lib/stores/selection-store.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { TaskOperations } from '$lib/services/domain/task';
import { TaskInteractionsService } from '$lib/services/ui/task/task-interactions';
import { subTaskOperations } from '$lib/services/domain/subtask';

const makeTask = (): TaskWithSubTasks => ({
  id: 'task-1',
  projectId: 'project-1',
  listId: 'list-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'in_progress',
  priority: 2,
  assignedUserIds: [],
  tagIds: [],
  orderIndex: 0,
  planStartDate: undefined,
  planEndDate: new Date('2024-01-15'),
  isRangeDate: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  isArchived: false,
  subTasks: [],
  tags: []
});

const renderComponent = (
  overrideProps: Partial<{
    isSubTask: boolean;
    description?: string;
    isNewTaskMode?: boolean;
    customProps?: Record<string, unknown>;
  }> = {}
) => {
  const onDescriptionChange = vi.fn();
  const task = makeTask();
  const formData = {
    title: task.title,
    description: overrideProps.description ?? task.description ?? '',
    plan_start_date: task.planStartDate,
    plan_end_date: task.planEndDate,
    is_range_date: task.isRangeDate ?? false,
    priority: task.priority
  };

  const result = render(TaskDescriptionEditor, {
    currentItem: task,
    isSubTask: overrideProps.isSubTask ?? false,
    isNewTaskMode: overrideProps.isNewTaskMode ?? false,
    formData,
    onDescriptionChange,
    ...(overrideProps.customProps ?? {})
  });

  return { result, onDescriptionChange };
};

describe('TaskDescriptionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current description', () => {
    const { result } = renderComponent();
    const textarea = result.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toHaveValue('Test description');
  });

  it('adds optional badge for subtasks', () => {
    const { result } = renderComponent({ isSubTask: true });
    const label = result.getByText(/description/i);
    expect(label).toHaveTextContent('optional');
  });

  it('omits optional badge for main tasks', () => {
    const { result } = renderComponent({ isSubTask: false });
    expect(result.queryByText(/optional/i)).toBeNull();
  });

  it('emits change event when user types', async () => {
    const { result, onDescriptionChange } = renderComponent();
    const textarea = result.getByRole('textbox') as HTMLTextAreaElement;
    await fireEvent.input(textarea, { target: { value: 'Updated text' } });
    expect(onDescriptionChange).toHaveBeenCalledWith('Updated text');
  });

  it('uses task placeholder when description empty for main task', () => {
    const { result } = renderComponent({ description: '', isSubTask: false });
    const textarea = result.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.placeholder).toBe('task_description');
  });

  it('uses subtask placeholder when description empty for subtask', () => {
    const { result } = renderComponent({ description: '', isSubTask: true });
    const textarea = result.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.placeholder).toBe('sub_task_description_optional');
  });
});

const milkTag = {
  id: 'tag-milk',
  name: 'milk',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deleted: false,
  updatedBy: 'tester'
} as Tag;

const formData = {
  title: 'Buy',
  description: '',
  plan_start_date: undefined,
  plan_end_date: undefined,
  is_range_date: false,
  priority: 1
};

function projectTree(): ProjectTree {
  return {
    id: 'project-1',
    name: 'Home',
    taskLists: [
      {
        id: 'empty-list',
        tasks: []
      },
      {
        id: 'list-1',
        tasks: [
          { id: 'other-task', subTasks: [{ id: 'nope' }] },
          { id: 'bare-task' },
          { id: 'task-1', listId: 'list-1', subTasks: [{ id: 'sub-1', taskId: 'task-1' }] }
        ]
      }
    ]
  } as unknown as ProjectTree;
}

async function detectTag(value: string) {
  const textarea = document.getElementById('task-description') as HTMLTextAreaElement;
  textarea.value = value;
  textarea.selectionStart = value.length;
  textarea.selectionEnd = value.length;
  await fireEvent.input(textarea);
  await fireEvent.keyDown(textarea, { key: 'Enter' });
}

describe('TaskDescriptionEditor tag routing', () => {
  beforeEach(() => {
    taskStore.setProjects([]);
    selectionStore.selectProject(null);
    (tagStore as { searchTags: (query: string) => Tag[] }).searchTags = vi.fn((query: string) =>
      query === 'mi' ? [milkTag] : []
    );
    (
      tagStore as { getOrCreateTagWithProject: (name: string, projectId: string) => Promise<Tag | null> }
    ).getOrCreateTagWithProject = vi.fn(async () => milkTag);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    taskStore.setProjects([]);
    selectionStore.selectProject(null);
  });

  it('creates a description tag in the selected project while drafting a new task', async () => {
    selectionStore.selectProject('project-9');
    const addToNewTask = vi
      .spyOn(TaskInteractionsService.prototype, 'addTagToNewTask')
      .mockResolvedValue(undefined);
    render(TaskDescriptionEditor, {
      props: {
        currentItem: { id: 'draft', title: 'New' } as TaskWithSubTasks,
        isSubTask: false,
        isNewTaskMode: true,
        formData,
        onDescriptionChange: vi.fn()
      }
    });

    await detectTag('New #fresh');

    expect(tagStore.getOrCreateTagWithProject).toHaveBeenCalledWith('fresh', 'project-9');
    expect(addToNewTask).toHaveBeenCalledWith('fresh');
  });

  it('resolves a subtask through its parent project and a task through its list', async () => {
    taskStore.setProjects([projectTree()]);
    const addToTask = vi.spyOn(TaskOperations.prototype, 'addTagToTaskByName').mockResolvedValue(undefined);
    const addToSubTask = vi.mocked(subTaskOperations.addTagToSubTaskByName);
    const { rerender } = render(TaskDescriptionEditor, {
      props: {
        currentItem: { id: 'sub-1', taskId: 'task-1', title: 'Child' } as SubTask,
        isSubTask: true,
        formData,
        onDescriptionChange: vi.fn()
      }
    });
    expect(document.body).toHaveTextContent('optional');

    await detectTag('Child #fresh');
    expect(tagStore.getOrCreateTagWithProject).toHaveBeenCalledWith('fresh', 'project-1');
    expect(addToSubTask).toHaveBeenCalledWith('sub-1', 'task-1', 'fresh');

    await rerender({
      currentItem: { id: 'task-1', listId: 'list-1', title: 'Buy' } as TaskWithSubTasks,
      isSubTask: false,
      formData,
      onDescriptionChange: vi.fn()
    });
    expect(document.body).not.toHaveTextContent('optional');
    await detectTag('Buy #fresh');
    expect(tagStore.getOrCreateTagWithProject).toHaveBeenCalledWith('fresh', 'project-1');
    expect(addToTask).toHaveBeenCalledWith('task-1', 'fresh');
  });

  it('still attaches a known tag when the project cannot be resolved, and ignores items that cannot own one', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const addToTask = vi.spyOn(TaskOperations.prototype, 'addTagToTaskByName').mockResolvedValue(undefined);
    const addToNewTask = vi
      .spyOn(TaskInteractionsService.prototype, 'addTagToNewTask')
      .mockResolvedValue(undefined);
    const addToSubTask = vi.mocked(subTaskOperations.addTagToSubTaskByName);
    const { rerender } = render(TaskDescriptionEditor, {
      props: {
        currentItem: { id: 'missing', taskId: 'task-x', title: 'Child' } as SubTask,
        isSubTask: true,
        formData,
        onDescriptionChange: vi.fn()
      }
    });

    await detectTag('Child #fresh');
    expect(tagStore.getOrCreateTagWithProject).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('プロジェクトIDが不明のためタグを作成できません');

    await detectTag('Child #mi');
    expect(addToSubTask).toHaveBeenCalledWith('missing', 'task-x', 'milk');

    addToSubTask.mockClear();
    await rerender({
      currentItem: { id: 'orphan', title: 'Orphan' } as TaskWithSubTasks,
      isSubTask: false,
      formData,
      onDescriptionChange: vi.fn()
    });
    await detectTag('Orphan #mi');

    await rerender({
      currentItem: { id: 'loose', title: 'Loose' } as SubTask,
      isSubTask: true,
      formData,
      onDescriptionChange: vi.fn()
    });
    await detectTag('Loose #mi');

    await rerender({
      currentItem: null as unknown as TaskWithSubTasks,
      isSubTask: false,
      isNewTaskMode: true,
      formData,
      onDescriptionChange: vi.fn()
    });
    await detectTag('Gone #mi');

    expect(addToTask).not.toHaveBeenCalled();
    expect(addToNewTask).not.toHaveBeenCalled();
    expect(addToSubTask).not.toHaveBeenCalled();
  });
});
