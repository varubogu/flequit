import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { TaskInteractionsService } from '$lib/services/ui/task/task-interactions';
import { TaskEntitiesStore } from '$lib/stores/tasks/task-entities-store.svelte';
import { TaskSelectionStore } from '$lib/stores/tasks/task-selection-store.svelte';
import { TaskDraftStore } from '$lib/stores/tasks/task-draft-store.svelte';
import type { ProjectTree } from '$lib/types/project';
import type { TaskWithSubTasks } from '$lib/types/task';
import type { Tag } from '$lib/types/tag';

interface SelectionStateMock {
  selectedProjectId: string | null;
  selectedListId: string | null;
  selectedTaskId: string | null;
  selectedSubTaskId: string | null;
  pendingTaskSelection: string | null;
  pendingSubTaskSelection: string | null;
  selectProject(projectId: string | null): void;
  selectList(listId: string | null): void;
  selectTask(taskId: string | null): void;
  selectSubTask(subTaskId: string | null): void;
  clearPendingSelections(): void;
}

function createTag(): Tag {
  const now = new Date();
  return {
    id: 'tag-1',
    name: 'Urgent',
    color: '#ff0000',
    orderIndex: 0,
    createdAt: now,
    updatedAt: now
  };
}

function createProjects(): ProjectTree[] {
  const now = new Date();
  const tag = createTag();
  const task: TaskWithSubTasks = {
    id: 'task-1',
    projectId: 'project-1',
    listId: 'list-1',
    title: 'Task',
    description: '',
    status: 'not_started',
    priority: 0,
    planStartDate: now,
    planEndDate: now,
    isRangeDate: false,
    orderIndex: 0,
    isArchived: false,
    assignedUserIds: [],
    tagIds: [],
    createdAt: now,
    updatedAt: now,
    subTasks: [],
    tags: [tag]
  };

  return [
    {
      id: 'project-1',
      name: 'Project 1',
      description: '',
      color: '#ffffff',
      orderIndex: 0,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      taskLists: [
        {
          id: 'list-1',
          projectId: 'project-1',
          name: 'List 1',
          description: '',
          color: '#cccccc',
          orderIndex: 0,
          isArchived: false,
          createdAt: now,
          updatedAt: now,
          tasks: [task]
        }
      ]
    }
  ];
}

describe('TaskInteractionsService', () => {
  let entities: TaskEntitiesStore;
  let selectionState: SelectionStateMock;
  let selection: TaskSelectionStore;
  let taskListStoreStub: { getProjectIdByListId: Mock };
  let draft: TaskDraftStore;
  let taskOperationsStub: { addTask: Mock };
  let tagStoreStub: { getOrCreateTagWithProject: Mock };
  let service: TaskInteractionsService;

  beforeEach(() => {
    const projectStoreMock = {
      projects: [] as ProjectTree[],
      setProjects(projects: ProjectTree[]) {
        this.projects = projects;
      },
      loadProjects(projects: ProjectTree[]) {
        this.projects = projects;
      }
    };

    const taskCoreStoreMock = {
      setProjects: vi.fn(),
      loadProjectsData: vi.fn()
    };

    entities = new TaskEntitiesStore({
      projectStore: projectStoreMock,
      taskCoreStore: taskCoreStoreMock
    });
    entities.setProjects(createProjects());

    selectionState = {
      selectedProjectId: 'project-1',
      selectedListId: 'list-1',
      selectedTaskId: null,
      selectedSubTaskId: null,
      pendingTaskSelection: null,
      pendingSubTaskSelection: null,
      selectProject(projectId: string | null) {
        this.selectedProjectId = projectId;
        this.selectedListId = null;
      },
      selectList(listId: string | null) {
        this.selectedListId = listId;
        this.selectedProjectId = null;
      },
      selectTask(taskId: string | null) {
        this.selectedTaskId = taskId;
        this.selectedSubTaskId = null;
      },
      selectSubTask(subTaskId: string | null) {
        this.selectedSubTaskId = subTaskId;
        this.selectedTaskId = null;
      },
      clearPendingSelections() {
        this.pendingTaskSelection = null;
        this.pendingSubTaskSelection = null;
      }
    };

    selection = new TaskSelectionStore({
      selectionStore: selectionState,
      entitiesStore: entities,
      subTaskStore: { selectedSubTask: null }
    });

    taskListStoreStub = {
      getProjectIdByListId: vi.fn(() => 'project-1')
    };

    draft = new TaskDraftStore({
      taskListStore: taskListStoreStub,
      selection
    });

    taskOperationsStub = {
      addTask: vi.fn(async (_listId: string, taskData: Partial<TaskWithSubTasks>) => ({
        ...(entities.getTaskById('task-1') ?? {}),
        ...taskData,
        id: 'created-task'
      }))
    };

    tagStoreStub = {
      getOrCreateTagWithProject: vi.fn(async () => ({
        ...createTag(),
        id: 'tag-2',
        name: 'New Tag'
      }))
    };

    service = new TaskInteractionsService({
      entities,
      selection,
      draft,
      taskOperations: taskOperationsStub,
      tagStore: tagStoreStub
    });
  });

  it('startNewTaskMode resets selection and initializes draft', () => {
    service.startNewTaskMode('list-1');

    expect(selection.selectedTaskId).toBeNull();
    expect(selection.selectedSubTaskId).toBeNull();
    expect(draft.isNewTaskMode).toBe(true);
    expect(draft.newTaskDraft?.listId).toBe('list-1');
  });

  it('cancelNewTaskMode clears draft and pending selections', () => {
    service.startNewTaskMode('list-1');
    selection.pendingTaskSelection = 'pending';

    service.cancelNewTaskMode();

    expect(draft.isNewTaskMode).toBe(false);
    expect(draft.newTaskDraft).toBeNull();
    expect(selection.pendingTaskSelection).toBeNull();
  });

  it('saveNewTask persists draft via mutations', async () => {
    service.startNewTaskMode('list-1');
    service.updateNewTaskData({ title: 'Created Task' });

    const newTaskId = await service.saveNewTask();

    expect(newTaskId).toBe('created-task');
    expect(taskOperationsStub.addTask).toHaveBeenCalled();
    expect(selection.selectedTaskId).toBe('created-task');
  });

  it('addTagToNewTask creates tag and appends to draft', async () => {
    service.startNewTaskMode('list-1');
    await service.addTagToNewTask('New Tag');

    expect(tagStoreStub.getOrCreateTagWithProject).toHaveBeenCalledWith('New Tag', 'project-1');
    expect(draft.newTaskDraft?.tags.some((tag) => tag.name === 'New Tag')).toBe(true);
  });

  it('removeTagFromAllTasks delegates to entities and draft', () => {
    service.startNewTaskMode('list-1');
    const tag = createTag();
    draft.updateDraft({ tags: [tag] });

    vi.spyOn(entities, 'removeTagFromAllTasks');

    service.removeTagFromAllTasks('tag-1');

    expect(entities.removeTagFromAllTasks).toHaveBeenCalledWith('tag-1');
    expect(draft.newTaskDraft?.tags).toHaveLength(0);
  });

  it('ignores a new-task save when the draft, list, or title is missing', async () => {
    await expect(service.saveNewTask()).resolves.toBeNull();

    service.startNewTaskMode('list-1');
    service.updateNewTaskData({ title: '   ' });
    await expect(service.saveNewTask()).resolves.toBeNull();

    service.updateNewTaskData({ title: 'Ready', listId: '' });
    await expect(service.saveNewTask()).resolves.toBeNull();
    expect(taskOperationsStub.addTask).not.toHaveBeenCalled();
  });

  it('returns null when creating the task fails', async () => {
    service.startNewTaskMode('list-1');
    service.updateNewTaskData({ title: 'Ready' });
    taskOperationsStub.addTask.mockResolvedValueOnce(null);

    await expect(service.saveNewTask()).resolves.toBeNull();
    expect(draft.isNewTaskMode).toBe(true);
  });

  it('skips tag creation for empty input, a missing project, or a failed lookup', async () => {
    await service.addTagToNewTask('New Tag');
    expect(tagStoreStub.getOrCreateTagWithProject).not.toHaveBeenCalled();

    service.startNewTaskMode('list-1');
    await service.addTagToNewTask('   ');
    expect(tagStoreStub.getOrCreateTagWithProject).not.toHaveBeenCalled();

    service.updateNewTaskData({ projectId: undefined });
    selectionState.selectedProjectId = null;
    await service.addTagToNewTask('New Tag');
    expect(tagStoreStub.getOrCreateTagWithProject).not.toHaveBeenCalled();

    selectionState.selectedProjectId = 'project-1';
    tagStoreStub.getOrCreateTagWithProject.mockResolvedValueOnce(null);
    await service.addTagToNewTask('New Tag');
    expect(draft.newTaskDraft?.tags).toHaveLength(0);
  });

  it('does not append a tag whose name already exists', async () => {
    service.startNewTaskMode('list-1');
    draft.updateDraft({ tags: [{ ...createTag(), name: 'new tag' }] });

    await service.addTagToNewTask('New Tag');

    expect(draft.newTaskDraft?.tags).toHaveLength(1);
  });

  it('removes a draft tag and ignores a missing draft or tag', () => {
    service.removeTagFromNewTask('tag-1');

    service.startNewTaskMode('list-1');
    service.removeTagFromNewTask('missing');
    expect(draft.newTaskDraft?.tags).toHaveLength(0);

    draft.updateDraft({ tags: [createTag()] });
    service.removeTagFromNewTask('tag-1');
    expect(draft.newTaskDraft?.tags).toHaveLength(0);
  });

  it('attaches a tag once and detaches it from an existing task', () => {
    const tag = createTag();
    expect(service.attachTagToTask('missing', tag)).toBeUndefined();
    expect(service.detachTagFromTask('missing', 'tag-1')).toBeNull();

    service.attachTagToTask('task-1', tag);
    expect(entities.getTaskById('task-1')?.tags).toHaveLength(1);

    service.attachTagToTask('task-1', { ...tag, id: 'tag-2', name: 'URGENT' });
    expect(entities.getTaskById('task-1')?.tags).toHaveLength(1);

    expect(service.detachTagFromTask('task-1', 'missing')).toBeNull();
    expect(service.detachTagFromTask('task-1', 'tag-1')?.id).toBe('tag-1');
    expect(entities.getTaskById('task-1')?.tags).toHaveLength(0);
  });

  it('leaves draft tags unchanged when the removed or updated tag is absent', () => {
    service.removeTagFromAllTasks('missing');
    service.updateTagInAllTasks(createTag());

    service.startNewTaskMode('list-1');
    service.removeTagFromAllTasks('missing');
    service.updateTagInAllTasks({ ...createTag(), id: 'other' });
    expect(draft.newTaskDraft?.tags).toHaveLength(0);
  });

  it('applies tag updates from the window event and stops after dispose', () => {
    const updated = { ...createTag(), name: 'From event' };
    const spy = vi.spyOn(service, 'updateTagInAllTasks');

    window.dispatchEvent(new CustomEvent('tag-updated'));
    window.dispatchEvent(new CustomEvent('tag-updated', { detail: updated }));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(updated);

    service.dispose();
    window.dispatchEvent(new CustomEvent('tag-updated', { detail: updated }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('clears pending selections', () => {
    selection.pendingTaskSelection = 'pending';
    service.clearPendingSelections();
    expect(selection.pendingTaskSelection).toBeNull();
  });

  it('updateTagInAllTasks updates both entities and draft tags', () => {
    service.startNewTaskMode('list-1');
    const tag = createTag();
    draft.updateDraft({ tags: [tag] });
    const updated = { ...tag, name: 'Updated' };

    vi.spyOn(entities, 'updateTagInAllTasks');

    service.updateTagInAllTasks(updated);

    expect(entities.updateTagInAllTasks).toHaveBeenCalledWith(updated);
    expect(draft.newTaskDraft?.tags[0]?.name).toBe('Updated');
  });
});
