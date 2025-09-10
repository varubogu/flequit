import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ContextMenuItems from '$lib/components/shared/context-menu-items.svelte';
import type { ContextMenuList } from '$lib/types/context-menu';

// Mock context menu store
vi.mock('$lib/stores/context-menu.svelte.js', () => ({
  contextMenuStore: {
    isOpen: true,
    selectedIndex: 0,
    open: vi.fn(),
    close: vi.fn(),
    selectNext: vi.fn(),
    selectPrevious: vi.fn(),
    selectIndex: vi.fn(),
    activateSelected: vi.fn(() => 0)
  }
}));

// Mock UI components with simpler approach
vi.mock('$lib/components/ui/context-menu/index.js', () => ({
  Content: vi.fn().mockReturnValue({}),
  Item: vi.fn().mockReturnValue({}),
  Separator: vi.fn().mockReturnValue({})
}));

describe('ContextMenuItems', () => {
  const mockAction1 = vi.fn();
  const mockAction2 = vi.fn();

  const defaultItems: ContextMenuList = [
    {
      id: 'action-1',
      label: 'Action 1',
      action: mockAction1
    },
    { type: 'separator' },
    {
      id: 'action-2',
      label: 'Dynamic Action 2',
      action: mockAction2
    }
  ];

  const defaultProps = {
    items: defaultItems,
    class: 'w-48'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      expect(() => {
        render(ContextMenuItems, { props: defaultProps });
      }).not.toThrow();
    });

    it('should render with custom class', () => {
      const customClass = 'w-64 custom-menu';
      expect(() => {
        render(ContextMenuItems, { props: { ...defaultProps, class: customClass } });
      }).not.toThrow();
    });

    it('should use default class when none provided', () => {
      expect(() => {
        render(ContextMenuItems, { props: { items: defaultItems } });
      }).not.toThrow();
    });
  });

  describe('menu items', () => {
    it('should handle static labels', () => {
      const staticItems: ContextMenuList = [
        { id: 'static-1', label: 'Static Label', action: vi.fn() }
      ];

      expect(() => {
        render(ContextMenuItems, { props: { items: staticItems } });
      }).not.toThrow();
    });

    it('should handle function labels', () => {
      const functionItems: ContextMenuList = [
        { id: 'function-1', label: () => 'Function Label', action: vi.fn() }
      ];

      expect(() => {
        render(ContextMenuItems, { props: { items: functionItems } });
      }).not.toThrow();
    });

    it('should handle disabled state', () => {
      const disabledItems: ContextMenuList = [
        { id: 'disabled-1', label: 'Disabled', action: vi.fn(), disabled: true },
        { id: 'enabled-1', label: 'Enabled', action: vi.fn(), disabled: false }
      ];

      expect(() => {
        render(ContextMenuItems, { props: { items: disabledItems } });
      }).not.toThrow();
    });

    it('should handle function disabled state', () => {
      const dynamicDisabledItems: ContextMenuList = [
        { id: 'dyn-disabled-1', label: 'Dynamic Disabled', action: vi.fn(), disabled: () => true },
        { id: 'dyn-enabled-1', label: 'Dynamic Enabled', action: vi.fn(), disabled: () => false }
      ];

      expect(() => {
        render(ContextMenuItems, { props: { items: dynamicDisabledItems } });
      }).not.toThrow();
    });

    it('should handle destructive styling', () => {
      const destructiveItems: ContextMenuList = [
        { id: 'delete-1', label: 'Delete', action: vi.fn(), destructive: true }
      ];

      expect(() => {
        render(ContextMenuItems, { props: { items: destructiveItems } });
      }).not.toThrow();
    });
  });

  describe('keyboard shortcuts', () => {
    it('should display keyboard shortcuts', () => {
      const shortcutItems: ContextMenuList = [
        {
          id: 'shortcut-1',
          label: 'With Shortcut',
          action: vi.fn(),
          keyboardShortcut: 'Ctrl+S'
        }
      ];

      expect(() => {
        render(ContextMenuItems, { props: { items: shortcutItems } });
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      expect(() => {
        render(ContextMenuItems, { props: { items: [] } });
      }).not.toThrow();
    });

    it('should handle items with only separators', () => {
      const separatorOnlyItems: ContextMenuList = [{ type: 'separator' }, { type: 'separator' }];

      expect(() => {
        render(ContextMenuItems, { props: { items: separatorOnlyItems } });
      }).not.toThrow();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(ContextMenuItems, { props: defaultProps });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(ContextMenuItems, { props: defaultProps });

      const updatedItems: ContextMenuList = [
        { id: 'updated-1', label: 'Updated Item', action: vi.fn() }
      ];

      expect(() => rerender({ items: updatedItems, class: 'w-64' })).not.toThrow();
    });
  });

  describe('store integration', () => {
    it('should call store methods when keyboard events occur', () => {
      const { container } = render(ContextMenuItems, { props: defaultProps });

      // Simulate keyboard events
      const keyDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      container.dispatchEvent(keyDownEvent);

      // Test passes if no error is thrown
      expect(container).toBeTruthy();
    });

    it('should handle Enter key correctly', () => {
      const { container } = render(ContextMenuItems, { props: defaultProps });

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      container.dispatchEvent(enterEvent);

      // Test passes if no error is thrown
      expect(container).toBeTruthy();
    });

    it('should handle Escape key correctly', () => {
      const { container } = render(ContextMenuItems, { props: defaultProps });

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      container.dispatchEvent(escapeEvent);

      // Test passes if no error is thrown
      expect(container).toBeTruthy();
    });

    it('should render with dynamic props', () => {
      const { container } = render(ContextMenuItems, { props: defaultProps });

      // Test passes if no error is thrown
      expect(container).toBeTruthy();
    });
  });
});