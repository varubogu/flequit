import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProjectDragDropHandler } from '$lib/components/project/handlers/project-drag-drop-handler.svelte';
import type { ProjectTree } from '$lib/types/project';
import { DragDropManager } from '$lib/utils/drag-drop';

// Mock stores and services
vi.mock('$lib/services/domain/task/task-mutations-instance', () => ({
  taskMutations: {
    moveTaskToList: vi.fn()
  }
}));

vi.mock('$lib/stores/task-list-store.svelte', () => ({
  taskListStore: {
    moveTaskListToProject: vi.fn()
  }
}));

vi.mock('$lib/services/composite/project-composite', () => ({
  ProjectCompositeService: {
    moveProjectToPosition: vi.fn()
  }
}));

vi.mock('$lib/utils/drag-drop', () => ({
  DragDropManager: {
    startDrag: vi.fn(),
    handleDragOver: vi.fn(),
    handleDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragEnter: vi.fn(),
    handleDragLeave: vi.fn()
  }
}));

const { taskMutations } = await import('$lib/services/domain/task/task-mutations-instance');
const { taskListStore } = await import('$lib/stores/task-list-store.svelte');
const { ProjectCompositeService } = await import('$lib/services/composite/project-composite');

describe('ProjectDragDropHandler', () => {
  let handler: ReturnType<typeof createProjectDragDropHandler>;
  let mockProjects: ProjectTree[];
  let mockEvent: DragEvent;

  beforeEach(() => {
    mockProjects = [
      {
        id: 'project-1',
        name: 'Project 1',
        color: '#3b82f6',
        taskLists: [{ id: 'tasklist-1', name: 'List 1', tasks: [] }]
      },
      {
        id: 'project-2',
        name: 'Project 2',
        color: '#ef4444',
        taskLists: []
      }
    ];
    handler = createProjectDragDropHandler(() => mockProjects);
    // Mock DragEvent object for testing
    mockEvent = { preventDefault: vi.fn(), dataTransfer: {} } as unknown as DragEvent;
    vi.clearAllMocks();
  });

  describe('handleProjectDragStart', () => {
    it('should start drag with project data', () => {
      handler.handleProjectDragStart(mockEvent, mockProjects[0]);

      expect(DragDropManager.startDrag).toHaveBeenCalledWith(mockEvent, {
        type: 'project',
        id: 'project-1'
      });
    });
  });

  describe('handleProjectDragOver', () => {
    it('should handle drag over with project target', () => {
      handler.handleProjectDragOver(mockEvent, mockProjects[1]);

      expect(DragDropManager.handleDragOver).toHaveBeenCalledWith(mockEvent, {
        type: 'project',
        id: 'project-2'
      });
    });
  });

  describe('handleProjectDrop', () => {
    it('should handle project to project drop (reordering)', async () => {
      vi.mocked(DragDropManager.handleDrop).mockReturnValue({
        type: 'project',
        id: 'project-1'
      });

      await handler.handleProjectDrop(mockEvent, mockProjects[1]);

      expect(DragDropManager.handleDrop).toHaveBeenCalledWith(mockEvent, {
        type: 'project',
        id: 'project-2'
      });
      expect(ProjectCompositeService.moveProjectToPosition).toHaveBeenCalledWith(
        'project-1',
        1 // Index of project-2
      );
    });

    it('should handle tasklist to project drop', async () => {
      vi.mocked(DragDropManager.handleDrop).mockReturnValue({
        type: 'tasklist',
        id: 'tasklist-123'
      });

      await handler.handleProjectDrop(mockEvent, mockProjects[0]);

      expect(taskListStore.moveTaskListToProject).toHaveBeenCalledWith(
        'tasklist-123',
        'project-1'
      );
    });

    it('should handle task to project drop (to default task list)', async () => {
      vi.mocked(DragDropManager.handleDrop).mockReturnValue({
        type: 'task',
        id: 'task-123'
      });

      await handler.handleProjectDrop(mockEvent, mockProjects[0]);

      expect(taskMutations.moveTaskToList).toHaveBeenCalledWith('task-123', 'tasklist-1');
    });

    it('should not move task when project has no task lists', async () => {
      vi.mocked(DragDropManager.handleDrop).mockReturnValue({
        type: 'task',
        id: 'task-123'
      });

      await handler.handleProjectDrop(mockEvent, mockProjects[1]); // project-2 has no task lists

      expect(taskMutations.moveTaskToList).not.toHaveBeenCalled();
    });

    it('should do nothing when drag data is null', async () => {
      vi.mocked(DragDropManager.handleDrop).mockReturnValue(null);

      await handler.handleProjectDrop(mockEvent, mockProjects[0]);

      expect(ProjectCompositeService.moveProjectToPosition).not.toHaveBeenCalled();
      expect(taskListStore.moveTaskListToProject).not.toHaveBeenCalled();
      expect(taskMutations.moveTaskToList).not.toHaveBeenCalled();
    });
  });

  describe('handleProjectDragEnd', () => {
    it('should handle drag end', () => {
      handler.handleProjectDragEnd(mockEvent);

      expect(DragDropManager.handleDragEnd).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('handleProjectDragEnter', () => {
    it('should handle drag enter with element', () => {
      const element = document.createElement('div');

      handler.handleProjectDragEnter(mockEvent, element);

      expect(DragDropManager.handleDragEnter).toHaveBeenCalledWith(mockEvent, element);
    });
  });

  describe('handleProjectDragLeave', () => {
    it('should handle drag leave with element', () => {
      const element = document.createElement('div');

      handler.handleProjectDragLeave(mockEvent, element);

      expect(DragDropManager.handleDragLeave).toHaveBeenCalledWith(mockEvent, element);
    });
  });
});
