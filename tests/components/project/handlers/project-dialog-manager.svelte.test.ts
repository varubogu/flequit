import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProjectDialogManager } from '$lib/components/project/handlers/project-dialog-manager.svelte';
import type { ProjectTree } from '$lib/types/project';

// Mock stores and services
vi.mock('$lib/stores/task-list-store.svelte', () => ({
  taskListStore: {
    addTaskList: vi.fn()
  }
}));

vi.mock('$lib/stores/selection-store.svelte', () => ({
  selectionStore: {
    selectProject: vi.fn(),
    selectList: vi.fn()
  }
}));

vi.mock('$lib/services/composite/project-composite', () => ({
  ProjectCompositeService: {
    createProject: vi.fn(),
    updateProject: vi.fn()
  }
}));

const { taskListStore } = await import('$lib/stores/task-list-store.svelte');
const { selectionStore } = await import('$lib/stores/selection-store.svelte');
const { ProjectCompositeService } = await import('$lib/services/composite/project-composite');

const createMockTaskList = (overrides: Partial<ProjectTree['taskLists'][number]> = {}) => {
  const now = new Date();
  return {
    id: 'tasklist-123',
    projectId: 'project-123',
    name: 'New List',
    description: '',
    color: '#3b82f6',
    orderIndex: 0,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    tasks: [],
    ...overrides
  };
};

const createMockProject = (overrides: Partial<ProjectTree> = {}): ProjectTree => {
  const now = new Date();
  return {
    id: 'project-123',
    name: 'Test Project',
    description: '',
    color: '#3b82f6',
    orderIndex: 0,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    taskLists: [],
    ...overrides
  };
};

describe('ProjectDialogManager', () => {
  let onViewChange: ReturnType<typeof vi.fn>;
  let manager: ReturnType<typeof createProjectDialogManager>;
  let mockProject: ProjectTree;

  beforeEach(() => {
    onViewChange = vi.fn();
    manager = createProjectDialogManager(onViewChange);
    mockProject = createMockProject();
    vi.clearAllMocks();
  });

  describe('openProjectDialog', () => {
    it('should open project dialog in add mode', () => {
      manager.openProjectDialog('add');

      expect(manager.dialogState.showProjectDialog).toBe(true);
      expect(manager.dialogState.projectDialogMode).toBe('add');
      expect(manager.dialogState.editingProject).toBeNull();
    });

    it('should open project dialog in edit mode with project', () => {
      manager.openProjectDialog('edit', mockProject);

      expect(manager.dialogState.showProjectDialog).toBe(true);
      expect(manager.dialogState.projectDialogMode).toBe('edit');
      expect(manager.dialogState.editingProject).toEqual(mockProject);
    });
  });

  describe('openTaskListDialog', () => {
    it('should open task list dialog with project', () => {
      manager.openTaskListDialog('add', mockProject);

      expect(manager.dialogState.showTaskListDialog).toBe(true);
      expect(manager.dialogState.taskListDialogProject).toEqual(mockProject);
    });
  });

  describe('handleProjectSave', () => {
    it('should create new project in add mode', async () => {
      const newProject = createMockProject({ id: 'new-project-123' });
      vi.mocked(ProjectCompositeService.createProject).mockResolvedValue(newProject);

      manager.openProjectDialog('add');
      await manager.handleProjectSave({ name: 'New Project', color: '#3b82f6' });

      expect(ProjectCompositeService.createProject).toHaveBeenCalledWith({
        name: 'New Project',
        color: '#3b82f6'
      });
      expect(selectionStore.selectProject).toHaveBeenCalledWith('new-project-123');
      expect(onViewChange).toHaveBeenCalledWith('project');
      expect(manager.dialogState.showProjectDialog).toBe(false);
    });

    it('should update existing project in edit mode', async () => {
      manager.openProjectDialog('edit', mockProject);
      await manager.handleProjectSave({ name: 'Updated Project', color: '#ef4444' });

      expect(ProjectCompositeService.updateProject).toHaveBeenCalledWith('project-123', {
        name: 'Updated Project',
        color: '#ef4444'
      });
      expect(manager.dialogState.showProjectDialog).toBe(false);
    });

    it('should not call selectProject when project creation fails', async () => {
      vi.mocked(ProjectCompositeService.createProject).mockResolvedValue(null);

      manager.openProjectDialog('add');
      await manager.handleProjectSave({ name: 'New Project', color: '#3b82f6' });

      expect(selectionStore.selectProject).not.toHaveBeenCalled();
      expect(onViewChange).not.toHaveBeenCalled();
    });
  });

  describe('handleTaskListSave', () => {
    it('should create new task list and select it', async () => {
      const newTaskList = createMockTaskList();
      vi.mocked(taskListStore.addTaskList).mockResolvedValue(newTaskList);

      manager.openTaskListDialog('add', mockProject);
      await manager.handleTaskListSave({ name: 'New List' });

      expect(taskListStore.addTaskList).toHaveBeenCalledWith('project-123', {
        name: 'New List'
      });
      expect(selectionStore.selectList).toHaveBeenCalledWith('tasklist-123');
      expect(onViewChange).toHaveBeenCalledWith('tasklist');
      expect(manager.dialogState.showTaskListDialog).toBe(false);
    });

    it('should not call selectList when task list creation fails', async () => {
      vi.mocked(taskListStore.addTaskList).mockResolvedValue(null);

      manager.openTaskListDialog('add', mockProject);
      await manager.handleTaskListSave({ name: 'New List' });

      expect(selectionStore.selectList).not.toHaveBeenCalled();
      expect(onViewChange).not.toHaveBeenCalled();
    });

    it('should close dialog even without task list dialog project', async () => {
      // Don't open dialog, so taskListDialogProject is null
      await manager.handleTaskListSave({ name: 'New List' });

      expect(taskListStore.addTaskList).not.toHaveBeenCalled();
      expect(manager.dialogState.showTaskListDialog).toBe(false);
    });
  });

  describe('dialog close handlers', () => {
    it('should close project dialog', () => {
      manager.openProjectDialog('add');
      expect(manager.dialogState.showProjectDialog).toBe(true);

      manager.handleProjectDialogClose();
      expect(manager.dialogState.showProjectDialog).toBe(false);
    });

    it('should close task list dialog', () => {
      manager.openTaskListDialog('add', mockProject);
      expect(manager.dialogState.showTaskListDialog).toBe(true);

      manager.handleTaskListDialogClose();
      expect(manager.dialogState.showTaskListDialog).toBe(false);
    });
  });

  describe('without onViewChange callback', () => {
    it('should handle project save without view change callback', async () => {
      const managerWithoutCallback = createProjectDialogManager();
      const newProject = { ...mockProject, id: 'new-project-456' };
      vi.mocked(ProjectCompositeService.createProject).mockResolvedValue(newProject);

      managerWithoutCallback.openProjectDialog('add');
      await managerWithoutCallback.handleProjectSave({
        name: 'New Project',
        color: '#3b82f6'
      });

      expect(selectionStore.selectProject).toHaveBeenCalledWith('new-project-456');
      // onViewChange is not called because callback is not provided
    });

    it('should handle task list save without view change callback', async () => {
      const managerWithoutCallback = createProjectDialogManager();
      const newTaskList = createMockTaskList({ id: 'tasklist-456' });
      vi.mocked(taskListStore.addTaskList).mockResolvedValue(newTaskList);

      managerWithoutCallback.openTaskListDialog('add', mockProject);
      await managerWithoutCallback.handleTaskListSave({ name: 'New List' });

      expect(selectionStore.selectList).toHaveBeenCalledWith('tasklist-456');
      // onViewChange is not called because callback is not provided
    });
  });
});
