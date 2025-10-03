import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ViewStore } from '../../src/lib/stores/view-store.svelte';
import { ViewService } from '../../src/lib/services/ui/view';
import type { TaskWithSubTasks } from '$lib/types/task';

// Mock ViewService
vi.mock('../../src/lib/services/view-service', () => ({
  ViewService: {
    getTasksForView: vi.fn(),
    getViewTitle: vi.fn(),
    shouldShowAddButton: vi.fn(),
    handleViewChange: vi.fn()
  }
}));

const mockViewService = vi.mocked(ViewService);

describe('ViewStore', () => {
  let store: ViewStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new ViewStore();
  });

  describe('initialization', () => {
    test('should initialize with default values', () => {
      expect(store.currentView).toBe('all');
      expect(store.searchQuery).toBe('');
    });
  });

  describe('computed properties', () => {
    test('tasks should call ViewService.getTasksForView with current view and search query', () => {
      const mockTasks = [{ id: 'task-1', title: 'Test Task' }];
      mockViewService.getTasksForView.mockReturnValue(mockTasks as TaskWithSubTasks[]);

      store.currentView = 'today';
      store.searchQuery = 'test query';

      const tasks = store.tasks;

      expect(mockViewService.getTasksForView).toHaveBeenCalledWith('today', 'test query');
      expect(tasks).toEqual(mockTasks);
    });

    test('viewTitle should call ViewService.getViewTitle', () => {
      mockViewService.getViewTitle.mockReturnValue('Today Tasks');

      store.currentView = 'today';
      store.searchQuery = 'test';

      const title = store.viewTitle;

      expect(mockViewService.getViewTitle).toHaveBeenCalledWith('today', 'test');
      expect(title).toBe('Today Tasks');
    });

    test('showAddButton should call ViewService.shouldShowAddButton', () => {
      mockViewService.shouldShowAddButton.mockReturnValue(true);

      store.currentView = 'all';

      const shouldShow = store.showAddButton;

      expect(mockViewService.shouldShowAddButton).toHaveBeenCalledWith('all');
      expect(shouldShow).toBe(true);
    });
  });

  describe('changeView', () => {
    test('should change current view and call ViewService.handleViewChange', () => {
      store.changeView('today');

      expect(store.currentView).toBe('today');
      expect(mockViewService.handleViewChange).toHaveBeenCalledWith('today');
    });

    test('should clear search query when changing to non-search view', () => {
      store.searchQuery = 'test search';

      store.changeView('today');

      expect(store.searchQuery).toBe('');
      expect(store.currentView).toBe('today');
    });

    test('should not clear search query when changing to search view', () => {
      store.searchQuery = 'test search';

      store.changeView('search');

      expect(store.searchQuery).toBe('test search');
      expect(store.currentView).toBe('search');
    });
  });

  describe('performSearch', () => {
    test('should set search query and change view to search', () => {
      store.currentView = 'today';

      store.performSearch('my search query');

      expect(store.searchQuery).toBe('my search query');
      expect(store.currentView).toBe('search');
    });

    test('should update existing search query', () => {
      store.currentView = 'search';
      store.searchQuery = 'old query';

      store.performSearch('new query');

      expect(store.searchQuery).toBe('new query');
      expect(store.currentView).toBe('search');
    });
  });
});
