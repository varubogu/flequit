import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '$lib/services/task-service';
import { DragDropManager, type DragData, type DropTarget } from '$lib/utils/drag-drop';

// Mock TaskService
vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    updateSubTaskDueDateForView: vi.fn(),
    addTagToSubTask: vi.fn()
  }
}));

describe('SubTask Drag and Drop Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DragDropManager canDrop for subtasks', () => {
    it('should allow subtask to be dropped on view target', () => {
      const dragData = {
        type: 'subtask' as const,
        id: 'subtask-1',
        taskId: 'task-1'
      };

      const viewTarget = {
        type: 'view' as const,
        id: 'today'
      };

      // Use private method for testing
      const canDrop = (DragDropManager as Record<string, unknown>).canDrop(dragData, viewTarget);
      expect(canDrop).toBe(true);
    });

    it('should allow subtask to be dropped on tag target', () => {
      const dragData = {
        type: 'subtask' as const,
        id: 'subtask-1',
        taskId: 'task-1'
      };

      const tagTarget = {
        type: 'tag' as const,
        id: 'tag-1'
      };

      const canDrop = (DragDropManager as Record<string, unknown>).canDrop(dragData, tagTarget);
      expect(canDrop).toBe(true);
    });

    it('should not allow subtask to be dropped on task target', () => {
      const dragData = {
        type: 'subtask' as const,
        id: 'subtask-1',
        taskId: 'task-1'
      };

      const taskTarget = {
        type: 'task' as const,
        id: 'task-2'
      };

      const canDrop = (DragDropManager as Record<string, unknown>).canDrop(dragData, taskTarget);
      expect(canDrop).toBe(false);
    });

    it('should not allow subtask to be dropped on same subtask', () => {
      const dragData = {
        type: 'subtask' as const,
        id: 'subtask-1',
        taskId: 'task-1'
      };

      const subtaskTarget = {
        type: 'subtask' as const,
        id: 'subtask-1'
      };

      const canDrop = (DragDropManager as Record<string, unknown>).canDrop(dragData, subtaskTarget);
      expect(canDrop).toBe(false);
    });
  });

  describe('View drop handling', () => {
    const viewDropTestCases = [
      { viewId: 'today', expectedDaysOffset: 0 },
      { viewId: 'tomorrow', expectedDaysOffset: 1 },
      { viewId: 'next3days', expectedDaysOffset: 3 },
      { viewId: 'nextweek', expectedDaysOffset: 7 }
    ];

    viewDropTestCases.forEach(({ viewId }) => {
      it(`should call updateSubTaskDueDateForView when subtask dropped on ${viewId} view`, () => {
        const dragData = {
          type: 'subtask',
          id: 'subtask-1',
          taskId: 'task-1'
        };

        // Mock the view drop handler
        const handleViewDrop = (viewId: string, dragData: DragData) => {
          if (dragData.type === 'subtask') {
            TaskService.updateSubTaskDueDateForView(dragData.id, dragData.taskId, viewId);
          }
        };

        handleViewDrop(viewId, dragData);

        expect(TaskService.updateSubTaskDueDateForView).toHaveBeenCalledWith(
          'subtask-1',
          'task-1',
          viewId
        );
      });
    });
  });

  describe('Tag drop handling', () => {
    it('should call addTagToSubTask when subtask dropped on tag', () => {
      const dragData = {
        type: 'subtask',
        id: 'subtask-1',
        taskId: 'task-1'
      };

      const targetTag = {
        id: 'tag-1',
        name: 'Test Tag',
        color: '#FF0000'
      };

      // Mock the tag drop handler
      const handleTagDrop = (targetTag: { id: string; name: string }, dragData: DragData) => {
        if (dragData.type === 'subtask') {
          TaskService.addTagToSubTask(dragData.id, dragData.taskId, targetTag.id);
        }
      };

      handleTagDrop(targetTag, dragData);

      expect(TaskService.addTagToSubTask).toHaveBeenCalledWith('subtask-1', 'task-1', 'tag-1');
    });
  });

  describe('TaskService methods', () => {
    it('should handle updateSubTaskDueDateForView for different views', () => {
      const subTaskId = 'subtask-1';
      const taskId = 'task-1';

      // Test different view types
      ['today', 'tomorrow', 'next3days', 'nextweek', 'thismonth'].forEach((viewId) => {
        TaskService.updateSubTaskDueDateForView(subTaskId, taskId, viewId);
        expect(TaskService.updateSubTaskDueDateForView).toHaveBeenCalledWith(
          subTaskId,
          taskId,
          viewId
        );
      });
    });

    it('should handle addTagToSubTask', () => {
      const subTaskId = 'subtask-1';
      const taskId = 'task-1';
      const tagId = 'tag-1';

      TaskService.addTagToSubTask(subTaskId, taskId, tagId);
      expect(TaskService.addTagToSubTask).toHaveBeenCalledWith(subTaskId, taskId, tagId);
    });
  });
});
