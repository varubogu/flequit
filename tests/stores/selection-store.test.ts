import { describe, test, expect, beforeEach } from 'vitest';
import { SelectionStore } from '../../src/lib/stores/selection-store.svelte';

describe('SelectionStore', () => {
  let store: SelectionStore;

  beforeEach(() => {
    store = new SelectionStore();
  });

  describe('initialization', () => {
    test('should initialize with null selections', () => {
      expect(store.selectedProjectId).toBeNull();
      expect(store.selectedListId).toBeNull();
      expect(store.selectedTaskId).toBeNull();
      expect(store.selectedSubTaskId).toBeNull();
    });

    test('should initialize with null pending selections', () => {
      expect(store.pendingTaskSelection).toBeNull();
      expect(store.pendingSubTaskSelection).toBeNull();
    });
  });

  describe('selectProject', () => {
    test('should set selected project ID', () => {
      store.selectProject('project-1');
      expect(store.selectedProjectId).toBe('project-1');
    });

    test('should clear selection when null is passed', () => {
      store.selectProject('project-1');
      store.selectProject(null);
      expect(store.selectedProjectId).toBeNull();
    });

    test('should update selection when called multiple times', () => {
      store.selectProject('project-1');
      store.selectProject('project-2');
      expect(store.selectedProjectId).toBe('project-2');
    });
  });

  describe('selectList', () => {
    test('should set selected list ID', () => {
      store.selectList('list-1');
      expect(store.selectedListId).toBe('list-1');
    });

    test('should clear selection when null is passed', () => {
      store.selectList('list-1');
      store.selectList(null);
      expect(store.selectedListId).toBeNull();
    });

    test('should update selection when called multiple times', () => {
      store.selectList('list-1');
      store.selectList('list-2');
      expect(store.selectedListId).toBe('list-2');
    });
  });

  describe('selectTask', () => {
    test('should set selected task ID', () => {
      store.selectTask('task-1');
      expect(store.selectedTaskId).toBe('task-1');
    });

    test('should clear selection when null is passed', () => {
      store.selectTask('task-1');
      store.selectTask(null);
      expect(store.selectedTaskId).toBeNull();
    });

    test('should update selection when called multiple times', () => {
      store.selectTask('task-1');
      store.selectTask('task-2');
      expect(store.selectedTaskId).toBe('task-2');
    });
  });

  describe('selectSubTask', () => {
    test('should set selected subtask ID', () => {
      store.selectSubTask('subtask-1');
      expect(store.selectedSubTaskId).toBe('subtask-1');
    });

    test('should clear selection when null is passed', () => {
      store.selectSubTask('subtask-1');
      store.selectSubTask(null);
      expect(store.selectedSubTaskId).toBeNull();
    });

    test('should update selection when called multiple times', () => {
      store.selectSubTask('subtask-1');
      store.selectSubTask('subtask-2');
      expect(store.selectedSubTaskId).toBe('subtask-2');
    });
  });

  describe('pending selections', () => {
    test('should allow setting pending task selection', () => {
      store.pendingTaskSelection = 'task-1';
      expect(store.pendingTaskSelection).toBe('task-1');
    });

    test('should allow setting pending subtask selection', () => {
      store.pendingSubTaskSelection = 'subtask-1';
      expect(store.pendingSubTaskSelection).toBe('subtask-1');
    });

    test('should clear pending selections', () => {
      store.pendingTaskSelection = 'task-1';
      store.pendingSubTaskSelection = 'subtask-1';

      store.clearPendingSelections();

      expect(store.pendingTaskSelection).toBeNull();
      expect(store.pendingSubTaskSelection).toBeNull();
    });
  });

  describe('independence of selections', () => {
    test('should allow independent project and list selections', () => {
      store.selectProject('project-1');
      store.selectList('list-1');

      expect(store.selectedProjectId).toBe('project-1');
      expect(store.selectedListId).toBe('list-1');
    });

    test('should allow independent task and subtask selections', () => {
      store.selectTask('task-1');
      store.selectSubTask('subtask-1');

      expect(store.selectedTaskId).toBe('task-1');
      expect(store.selectedSubTaskId).toBe('subtask-1');
    });

    test('should allow all selections simultaneously', () => {
      store.selectProject('project-1');
      store.selectList('list-1');
      store.selectTask('task-1');
      store.selectSubTask('subtask-1');

      expect(store.selectedProjectId).toBe('project-1');
      expect(store.selectedListId).toBe('list-1');
      expect(store.selectedTaskId).toBe('task-1');
      expect(store.selectedSubTaskId).toBe('subtask-1');
    });
  });

  describe('reset', () => {
    test('should clear all selections', () => {
      store.selectProject('project-1');
      store.selectList('list-1');
      store.selectTask('task-1');
      store.selectSubTask('subtask-1');

      store.reset();

      expect(store.selectedProjectId).toBeNull();
      expect(store.selectedListId).toBeNull();
      expect(store.selectedTaskId).toBeNull();
      expect(store.selectedSubTaskId).toBeNull();
    });

    test('should clear all pending selections', () => {
      store.pendingTaskSelection = 'task-1';
      store.pendingSubTaskSelection = 'subtask-1';

      store.reset();

      expect(store.pendingTaskSelection).toBeNull();
      expect(store.pendingSubTaskSelection).toBeNull();
    });

    test('should work correctly when called multiple times', () => {
      store.selectProject('project-1');
      store.reset();
      store.reset();

      expect(store.selectedProjectId).toBeNull();
    });
  });

  describe('complex scenarios', () => {
    test('should handle rapid selection changes', () => {
      for (let i = 0; i < 100; i++) {
        store.selectTask(`task-${i}`);
      }
      expect(store.selectedTaskId).toBe('task-99');
    });

    test('should handle alternating selections and clears', () => {
      store.selectTask('task-1');
      store.selectTask(null);
      store.selectTask('task-2');
      store.selectTask(null);

      expect(store.selectedTaskId).toBeNull();
    });

    test('should maintain independence across resets', () => {
      store.selectProject('project-1');
      store.selectTask('task-1');
      store.reset();

      store.selectList('list-1');
      store.selectSubTask('subtask-1');

      expect(store.selectedProjectId).toBeNull();
      expect(store.selectedTaskId).toBeNull();
      expect(store.selectedListId).toBe('list-1');
      expect(store.selectedSubTaskId).toBe('subtask-1');
    });
  });
});
