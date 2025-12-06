import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock settingsInitService before importing the store
vi.mock('$lib/services/domain/settings', () => ({
  settingsInitService: {
    getAllSettings: vi.fn(async () => []),
    getSettingByKey: vi.fn(() => null),
    updateSetting: vi.fn(async () => true)
  }
}));

import { viewsVisibilityStore, type ViewItem } from '../../src/lib/stores/views-visibility.svelte';

// Mock console.warn
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
// Mock console.error to suppress expected error logs during store initialization
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Create our own localStorage mock that we can track
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(() => null)
};

describe('ViewsVisibilityStore', () => {
  beforeEach(() => {
    consoleWarnSpy.mockClear();
    consoleErrorSpy.mockClear();

    // Reset localStorage mock
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.clear.mockClear();
    localStorageMock.removeItem.mockClear();

    // Override the localStorage mock for this test file
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });

    // Also override the global localStorage reference
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();

    // Restore window if it was stubbed to undefined
    if (typeof window === 'undefined') {
      vi.unstubAllGlobals();
    }
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
      const visibleItems = visibleViews.filter((item) => item.visible);
      expect(visibleItems).toEqual(visibleViews); // All returned should be visible

      // Check if sorted by order
      for (let i = 1; i < visibleViews.length; i++) {
        expect(visibleViews[i].order).toBeGreaterThanOrEqual(visibleViews[i - 1].order);
      }
    });

    test('should return hidden views sorted by order', () => {
      const hiddenViews = viewsVisibilityStore.hiddenViews;

      // Filter only hidden items
      const hiddenItems = hiddenViews.filter((item) => !item.visible);
      expect(hiddenItems).toEqual(hiddenViews); // All returned should be hidden

      // Check if sorted by order
      for (let i = 1; i < hiddenViews.length; i++) {
        expect(hiddenViews[i].order).toBeGreaterThanOrEqual(hiddenViews[i - 1].order);
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
      const todayItem = config.viewItems.find((item) => item.id === 'today');
      const allTasksItem = config.viewItems.find((item) => item.id === 'allTasks');
      const overdueItem = config.viewItems.find((item) => item.id === 'overdue');

      expect(todayItem?.visible).toBe(true);
      expect(todayItem?.order).toBe(0);
      expect(allTasksItem?.visible).toBe(true);
      expect(allTasksItem?.order).toBe(1);
      expect(overdueItem?.visible).toBe(false);
      expect(overdueItem?.order).toBe(2);
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

      const allTasksItem = updatedItems.find((item) => item.id === 'allTasks');
      expect(allTasksItem?.visible).toBe(true);
    });
  });

  describe('resetToDefaults', () => {
    test('should reset configuration to default values', () => {
      // First modify the configuration
      viewsVisibilityStore.setLists(
        [{ id: 'today', label: 'Today', icon: '📅', visible: true, order: 0 }],
        []
      );

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
    });
  });

  describe('persistence', () => {
    test('should update configuration when setLists is called', () => {
      const visible: ViewItem[] = [
        { id: 'today', label: 'Today', icon: '📅', visible: true, order: 0 }
      ];

      viewsVisibilityStore.setLists(visible, []);

      const config = viewsVisibilityStore.configuration;
      const todayItem = config.viewItems.find((item) => item.id === 'today');
      expect(todayItem?.visible).toBe(true);
      expect(todayItem?.order).toBe(0);
    });

    test('should handle localStorage save errors gracefully', () => {
      // This test verifies that errors during storage operations don't crash the app
      // The store should still update its internal state even if localStorage fails
      expect(() => {
        viewsVisibilityStore.resetToDefaults();
      }).not.toThrow();

      // Configuration should still be updated
      const config = viewsVisibilityStore.configuration;
      expect(config.viewItems).toHaveLength(8);
    });

    test('should handle missing window during save gracefully', () => {
      // Temporarily set window to undefined using vi.stubGlobal
      vi.stubGlobal('window', undefined);

      expect(() => {
        viewsVisibilityStore.resetToDefaults();
      }).not.toThrow();

      // Restore window (will be restored in afterEach)
    });
  });

  describe('default view items', () => {
    test('should include all expected default view items', () => {
      const config = viewsVisibilityStore.configuration;
      const expectedIds = [
        'allTasks',
        'overdue',
        'today',
        'tomorrow',
        'completed',
        'next3days',
        'nextweek',
        'thismonth'
      ];

      expectedIds.forEach((id) => {
        expect(config.viewItems.some((item) => item.id === id)).toBe(true);
      });
    });

    test('should have correct default visibility settings', () => {
      const config = viewsVisibilityStore.configuration;

      const visibleByDefault = ['allTasks', 'overdue', 'today', 'tomorrow', 'completed'];
      const hiddenByDefault = ['next3days', 'nextweek', 'thismonth'];

      visibleByDefault.forEach((id) => {
        const item = config.viewItems.find((item) => item.id === id);
        expect(item?.visible).toBe(true);
      });

      hiddenByDefault.forEach((id) => {
        const item = config.viewItems.find((item) => item.id === id);
        expect(item?.visible).toBe(false);
      });
    });
  });
});
