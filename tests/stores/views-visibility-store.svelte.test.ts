import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { viewsVisibilityStore, type ViewItem } from '../../src/lib/stores/views-visibility.svelte';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock console.warn
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock window.localStorage globally
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
});

// Mock window with proper configuration  
Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: localStorageMock,
  },
  writable: true,
  configurable: true
});

// Mock document for Svelte
Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: vi.fn(),
  },
  writable: true,
  configurable: true
});

describe('ViewsVisibilityStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with default view items', () => {
      const config = viewsVisibilityStore.configuration;
      expect(config.viewItems).toHaveLength(8);
      expect(config.viewItems[0]).toMatchObject({
        id: 'allTasks',
        label: 'All Tasks',
        icon: '📝',
        visible: true,
        order: 0
      });
    });
  });

  describe('computed properties', () => {
    test('should return visible views sorted by order', () => {
      const visibleViews = viewsVisibilityStore.visibleViews;
      
      // Filter only visible items
      const visibleItems = visibleViews.filter(item => item.visible);
      expect(visibleItems).toEqual(visibleViews); // All returned should be visible
      
      // Check if sorted by order
      for (let i = 1; i < visibleViews.length; i++) {
        expect(visibleViews[i].order).toBeGreaterThanOrEqual(visibleViews[i-1].order);
      }
    });

    test('should return hidden views sorted by order', () => {
      const hiddenViews = viewsVisibilityStore.hiddenViews;
      
      // Filter only hidden items
      const hiddenItems = hiddenViews.filter(item => !item.visible);
      expect(hiddenItems).toEqual(hiddenViews); // All returned should be hidden
      
      // Check if sorted by order
      for (let i = 1; i < hiddenViews.length; i++) {
        expect(hiddenViews[i].order).toBeGreaterThanOrEqual(hiddenViews[i-1].order);
      }
    });
  });

  describe('setLists', () => {
    test('should update visibility and order of view items', () => {
      const visible: ViewItem[] = [
        { id: 'today', label: 'Today', icon: '📅', visible: true, order: 0 },
        { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 1 }
      ];
      
      const hidden: ViewItem[] = [
        { id: 'overdue', label: 'Overdue', icon: '🚨', visible: false, order: 2 }
      ];
      
      viewsVisibilityStore.setLists(visible, hidden);
      
      const config = viewsVisibilityStore.configuration;
      const todayItem = config.viewItems.find(item => item.id === 'today');
      const allTasksItem = config.viewItems.find(item => item.id === 'allTasks');
      const overdueItem = config.viewItems.find(item => item.id === 'overdue');
      
      expect(todayItem?.visible).toBe(true);
      expect(todayItem?.order).toBe(0);
      expect(allTasksItem?.visible).toBe(true);
      expect(allTasksItem?.order).toBe(1);
      expect(overdueItem?.visible).toBe(false);
      expect(overdueItem?.order).toBe(2);
      
      // localStorage setItem should be called
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should maintain items not in the UI lists', () => {
      const visible: ViewItem[] = [
        { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 }
      ];
      
      const hidden: ViewItem[] = [];
      
      const originalItems = viewsVisibilityStore.configuration.viewItems;
      const originalCount = originalItems.length;
      
      viewsVisibilityStore.setLists(visible, hidden);
      
      const updatedItems = viewsVisibilityStore.configuration.viewItems;
      expect(updatedItems).toHaveLength(originalCount); // Should maintain all items
      
      const allTasksItem = updatedItems.find(item => item.id === 'allTasks');
      expect(allTasksItem?.visible).toBe(true);
    });
  });

  describe('resetToDefaults', () => {
    test('should reset configuration to default values', () => {
      // First modify the configuration
      viewsVisibilityStore.setLists([
        { id: 'today', label: 'Today', icon: '📅', visible: true, order: 0 }
      ], []);
      
      // Then reset
      viewsVisibilityStore.resetToDefaults();
      
      const config = viewsVisibilityStore.configuration;
      expect(config.viewItems).toHaveLength(8);
      expect(config.viewItems[0]).toMatchObject({
        id: 'allTasks',
        label: 'All Tasks',
        icon: '📝',
        visible: true,
        order: 0
      });
      
      // localStorage setItem should be called
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('persistence', () => {
    test('should save configuration to localStorage', () => {
      const visible: ViewItem[] = [
        { id: 'today', label: 'Today', icon: '📅', visible: true, order: 0 }
      ];
      
      viewsVisibilityStore.setLists(visible, []);
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should handle localStorage save errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // This should not throw even if localStorage fails
      expect(() => {
        viewsVisibilityStore.resetToDefaults();
      }).not.toThrow();
    });

    test('should handle missing window during save gracefully', () => {
      // Temporarily set window to undefined
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        configurable: true
      });
      
      expect(() => {
        viewsVisibilityStore.resetToDefaults();
      }).not.toThrow();
      
      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        configurable: true
      });
    });
  });

  describe('default view items', () => {
    test('should include all expected default view items', () => {
      const config = viewsVisibilityStore.configuration;
      const expectedIds = ['allTasks', 'overdue', 'today', 'tomorrow', 'completed', 'next3days', 'nextweek', 'thismonth'];
      
      expectedIds.forEach(id => {
        expect(config.viewItems.some(item => item.id === id)).toBe(true);
      });
    });

    test('should have correct default visibility settings', () => {
      const config = viewsVisibilityStore.configuration;
      
      const visibleByDefault = ['allTasks', 'overdue', 'today', 'tomorrow', 'completed'];
      const hiddenByDefault = ['next3days', 'nextweek', 'thismonth'];
      
      visibleByDefault.forEach(id => {
        const item = config.viewItems.find(item => item.id === id);
        expect(item?.visible).toBe(true);
      });
      
      hiddenByDefault.forEach(id => {
        const item = config.viewItems.find(item => item.id === id);
        expect(item?.visible).toBe(false);
      });
    });
  });
});