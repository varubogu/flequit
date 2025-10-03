import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskDetailService } from '$lib/services/ui/task-detail';
import { TaskService } from '$lib/services/domain/task';

// Mock TaskService
vi.mock('$lib/services/task-service', () => ({
  TaskService: {
    selectTask: vi.fn(),
    selectSubTask: vi.fn()
  }
}));

const mockTaskService = vi.mocked(TaskService);

describe('TaskDetailService', () => {
  let mockMobileInstance: { current: boolean };

  beforeEach(() => {
    // Reset static state before each test
    mockMobileInstance = { current: false };
    TaskDetailService.setMobileInstance(mockMobileInstance);

    // Force close drawer state regardless of mobile/desktop
    // Access the private state directly for testing
    (
      TaskDetailService as unknown as { taskDetailDrawerState: { open: boolean } }
    ).taskDetailDrawerState.open = false;

    TaskDetailService.setCloseHandler(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up subscribers
    const drawerState = TaskDetailService.drawerState;
    while (drawerState) {
      // Break to prevent infinite loop - we can't fully reset static state
      break;
    }
  });

  describe('drawer state management', () => {
    it('should have initial drawer state as closed', () => {
      const state = TaskDetailService.drawerState;
      expect(state.open).toBe(false);
    });

    it('should allow setting close handler', () => {
      const mockHandler = vi.fn();
      TaskDetailService.setCloseHandler(mockHandler);

      const state = TaskDetailService.drawerState;
      expect(state.onClose).toBe(mockHandler);
    });
  });

  describe('subscription management', () => {
    it('should allow subscribing and unsubscribing', () => {
      let callCount = 0;
      const callback = () => {
        callCount++;
      };

      const unsubscribe = TaskDetailService.subscribe(callback);

      // Trigger notification by opening drawer on mobile
      mockMobileInstance.current = true;
      TaskDetailService.openTaskDetail('task-123');

      expect(callCount).toBe(1);

      // Unsubscribe and trigger again
      unsubscribe();
      TaskDetailService.openTaskDetail('task-456');

      expect(callCount).toBe(1); // Should not increment
    });

    it('should notify multiple subscribers', () => {
      let callCount1 = 0;
      let callCount2 = 0;
      const callback1 = () => {
        callCount1++;
      };
      const callback2 = () => {
        callCount2++;
      };

      TaskDetailService.subscribe(callback1);
      TaskDetailService.subscribe(callback2);

      // Trigger notification
      mockMobileInstance.current = true;
      TaskDetailService.openTaskDetail('task-123');

      expect(callCount1).toBe(1);
      expect(callCount2).toBe(1);
    });
  });

  describe('mobile instance management', () => {
    it('should set mobile instance correctly', () => {
      const newMobileInstance = { current: true };
      TaskDetailService.setMobileInstance(newMobileInstance);

      // Test that mobile behavior is triggered
      TaskDetailService.openTaskDetail('task-123');
      expect(TaskDetailService.drawerState.open).toBe(true);
    });
  });

  describe('openTaskDetail', () => {
    it('should select task and not open drawer on desktop', () => {
      mockMobileInstance.current = false;

      TaskDetailService.openTaskDetail('task-123');

      expect(mockTaskService.selectTask).toHaveBeenCalledWith('task-123');
      expect(TaskDetailService.drawerState.open).toBe(false);
    });

    it('should select task and open drawer on mobile', () => {
      mockMobileInstance.current = true;

      TaskDetailService.openTaskDetail('task-123');

      expect(mockTaskService.selectTask).toHaveBeenCalledWith('task-123');
      expect(TaskDetailService.drawerState.open).toBe(true);
    });
  });

  describe('openSubTaskDetail', () => {
    it('should select subtask and not open drawer on desktop', () => {
      mockMobileInstance.current = false;

      TaskDetailService.openSubTaskDetail('subtask-123');

      expect(mockTaskService.selectSubTask).toHaveBeenCalledWith('subtask-123');
      expect(TaskDetailService.drawerState.open).toBe(false);
    });

    it('should select subtask and open drawer on mobile', () => {
      mockMobileInstance.current = true;

      TaskDetailService.openSubTaskDetail('subtask-123');

      expect(mockTaskService.selectSubTask).toHaveBeenCalledWith('subtask-123');
      expect(TaskDetailService.drawerState.open).toBe(true);
    });
  });

  describe('openNewTaskDetail', () => {
    it('should not open drawer on desktop', () => {
      mockMobileInstance.current = false;

      TaskDetailService.openNewTaskDetail();

      expect(TaskDetailService.drawerState.open).toBe(false);
    });

    it('should open drawer on mobile', () => {
      mockMobileInstance.current = true;

      TaskDetailService.openNewTaskDetail();

      expect(TaskDetailService.drawerState.open).toBe(true);
    });
  });

  describe('closeTaskDetail', () => {
    it('should not close drawer on desktop (no effect)', () => {
      mockMobileInstance.current = false;

      // First open drawer somehow (manually set state)
      mockMobileInstance.current = true;
      TaskDetailService.openTaskDetail('task-123');
      expect(TaskDetailService.drawerState.open).toBe(true);

      // Switch back to desktop and try to close
      mockMobileInstance.current = false;
      TaskDetailService.closeTaskDetail();

      expect(TaskDetailService.drawerState.open).toBe(true); // Should remain open
    });

    it('should close drawer on mobile', () => {
      mockMobileInstance.current = true;

      // First open drawer
      TaskDetailService.openTaskDetail('task-123');
      expect(TaskDetailService.drawerState.open).toBe(true);

      // Then close it
      TaskDetailService.closeTaskDetail();
      expect(TaskDetailService.drawerState.open).toBe(false);
    });

    it('should notify subscribers when closing on mobile', () => {
      let callCount = 0;
      const callback = () => {
        callCount++;
      };
      TaskDetailService.subscribe(callback);

      mockMobileInstance.current = true;

      // Open drawer (should notify once)
      TaskDetailService.openTaskDetail('task-123');
      expect(callCount).toBe(1);

      // Close drawer (should notify again)
      TaskDetailService.closeTaskDetail();
      expect(callCount).toBe(2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle switching between mobile and desktop modes', () => {
      // Start on mobile
      mockMobileInstance.current = true;
      TaskDetailService.openTaskDetail('task-123');
      expect(TaskDetailService.drawerState.open).toBe(true);

      // Switch to desktop - drawer should remain open but close action has no effect
      mockMobileInstance.current = false;
      TaskDetailService.closeTaskDetail();
      expect(TaskDetailService.drawerState.open).toBe(true);

      // Switch back to mobile and close
      mockMobileInstance.current = true;
      TaskDetailService.closeTaskDetail();
      expect(TaskDetailService.drawerState.open).toBe(false);
    });

    it('should handle multiple open operations', () => {
      mockMobileInstance.current = true;

      TaskDetailService.openTaskDetail('task-1');
      expect(TaskDetailService.drawerState.open).toBe(true);
      expect(mockTaskService.selectTask).toHaveBeenCalledWith('task-1');

      TaskDetailService.openTaskDetail('task-2');
      expect(TaskDetailService.drawerState.open).toBe(true);
      expect(mockTaskService.selectTask).toHaveBeenCalledWith('task-2');

      expect(mockTaskService.selectTask).toHaveBeenCalledTimes(2);
    });
  });
});
