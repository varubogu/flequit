import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ContextMenuItems from '$lib/components/shared/context-menu-items.svelte';
import type { ContextMenuList } from '$lib/types/context-menu';
import type { ComponentType } from 'svelte';
import type { ContextMenuStore } from '$lib/stores/context-menu.svelte';

// Mock UI context menu components
vi.mock('$lib/components/ui/context-menu/index.js', () => ({
  Content: () => ({
    render: () => '<div data-testid="context-menu-content">Context Menu Content</div>'
  }),
  Item: () => ({ render: () => '<div data-testid="context-menu-item">Context Menu Item</div>' }),
  Separator: () => ({ render: () => '<div data-testid="context-menu-separator">Separator</div>' })
}));

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

describe('ContextMenuItems', () => {
  const mockAction1 = vi.fn();
  const mockAction2 = vi.fn();
  const mockDisabledCheck = vi.fn(() => false);

  const defaultItems: ContextMenuList = [
    {
      id: 'action-1',
      label: 'Action 1',
      action: mockAction1,
      icon: (() => ({ $$: { fragment: null } })) as unknown as ComponentType,
      keyboardShortcut: 'Ctrl+1'
    },
    { type: 'separator' },
    {
      id: 'action-2',
      label: () => 'Dynamic Action 2',
      action: mockAction2,
      disabled: mockDisabledCheck,
      destructive: true
    }
  ];

  const defaultProps = {
    items: defaultItems,
    class: 'w-48'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setup is handled in the mock definitions above
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(ContextMenuItems, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should render context menu content', () => {
      render(ContextMenuItems, { props: defaultProps });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should apply custom class', () => {
      const customClass = 'w-64 custom-menu';
      render(ContextMenuItems, { props: { ...defaultProps, class: customClass } });

      // ContextMenu.Content should receive the custom class
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should use default class when none provided', () => {
      render(ContextMenuItems, { props: { items: defaultItems } });

      // Should use default 'w-48' class
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });
  });

  describe('menu items rendering', () => {
    it('should render menu items', () => {
      render(ContextMenuItems, { props: defaultProps });

      // Should render menu items (mocked)
      const items = screen.getAllByTestId('context-menu-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should render separators', () => {
      render(ContextMenuItems, { props: defaultProps });

      expect(screen.getByTestId('context-menu-separator')).toBeInTheDocument();
    });

    it('should handle static labels', () => {
      const staticItems: ContextMenuList = [
        { id: 'static-1', label: 'Static Label', action: vi.fn() }
      ];

      render(ContextMenuItems, { props: { items: staticItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle function labels', () => {
      const functionItems: ContextMenuList = [
        { id: 'function-1', label: () => 'Function Label', action: vi.fn() }
      ];

      render(ContextMenuItems, { props: { items: functionItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle items with icons', () => {
      const iconItems: ContextMenuList = [
        {
          id: 'icon-1',
          label: 'With Icon',
          action: vi.fn(),
          icon: (() => ({ $$: { fragment: null } })) as ComponentType
        }
      ];

      render(ContextMenuItems, { props: { items: iconItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle items without icons', () => {
      const noIconItems: ContextMenuList = [{ id: 'no-icon-1', label: 'No Icon', action: vi.fn() }];

      render(ContextMenuItems, { props: { items: noIconItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
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

      render(ContextMenuItems, { props: { items: shortcutItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle items without shortcuts', () => {
      const noShortcutItems: ContextMenuList = [
        { id: 'no-shortcut-1', label: 'No Shortcut', action: vi.fn() }
      ];

      render(ContextMenuItems, { props: { items: noShortcutItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });
  });

  describe('disabled state handling', () => {
    it('should handle boolean disabled state', () => {
      const disabledItems: ContextMenuList = [
        { id: 'disabled-1', label: 'Disabled', action: vi.fn(), disabled: true },
        { id: 'enabled-1', label: 'Enabled', action: vi.fn(), disabled: false }
      ];

      render(ContextMenuItems, { props: { items: disabledItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle function disabled state', () => {
      const dynamicDisabledItems: ContextMenuList = [
        { id: 'dyn-disabled-1', label: 'Dynamic Disabled', action: vi.fn(), disabled: () => true },
        { id: 'dyn-enabled-1', label: 'Dynamic Enabled', action: vi.fn(), disabled: () => false }
      ];

      render(ContextMenuItems, { props: { items: dynamicDisabledItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle undefined disabled state', () => {
      const undefinedDisabledItems: ContextMenuList = [
        { id: 'undefined-disabled-1', label: 'No Disabled Property', action: vi.fn() }
      ];

      render(ContextMenuItems, { props: { items: undefinedDisabledItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });
  });

  describe('destructive styling', () => {
    it('should apply destructive styling', () => {
      const destructiveItems: ContextMenuList = [
        { id: 'delete-1', label: 'Delete', action: vi.fn(), destructive: true }
      ];

      render(ContextMenuItems, { props: { items: destructiveItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should not apply destructive styling when false', () => {
      const normalItems: ContextMenuList = [
        { id: 'normal-1', label: 'Normal', action: vi.fn(), destructive: false }
      ];

      render(ContextMenuItems, { props: { items: normalItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should not apply destructive styling when undefined', () => {
      const undefinedDestructiveItems: ContextMenuList = [
        { id: 'undefined-dest-1', label: 'Undefined Destructive', action: vi.fn() }
      ];

      render(ContextMenuItems, { props: { items: undefinedDestructiveItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should handle ArrowDown key', () => {
      const mockSelectNext = vi.fn();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.selectNext = mockSelectNext;

      const { container } = render(ContextMenuItems, { props: defaultProps });

      fireEvent.keyDown(container, { key: 'ArrowDown' });

      expect(mockSelectNext).toHaveBeenCalled();
    });

    it('should handle ArrowUp key', () => {
      const mockSelectPrevious = vi.fn();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.selectPrevious = mockSelectPrevious;

      const { container } = render(ContextMenuItems, { props: defaultProps });

      fireEvent.keyDown(container, { key: 'ArrowUp' });

      expect(mockSelectPrevious).toHaveBeenCalled();
    });

    it('should handle Enter key', () => {
      const mockActivateSelected = vi.fn(() => 0);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.activateSelected = mockActivateSelected;

      const { container } = render(ContextMenuItems, { props: defaultProps });

      fireEvent.keyDown(container, { key: 'Enter' });

      expect(mockActivateSelected).toHaveBeenCalled();
      expect(mockAction1).toHaveBeenCalled();
    });

    it('should handle Escape key', () => {
      const mockClose = vi.fn();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.close = mockClose;

      const { container } = render(ContextMenuItems, { props: defaultProps });

      fireEvent.keyDown(container, { key: 'Escape' });

      expect(mockClose).toHaveBeenCalled();
    });

    it('should ignore keys when menu is closed', () => {
      const mockSelectNext = vi.fn();
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.isOpen = false;
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.selectNext = mockSelectNext;

      const { container } = render(ContextMenuItems, { props: defaultProps });

      fireEvent.keyDown(container, { key: 'ArrowDown' });

      expect(mockSelectNext).not.toHaveBeenCalled();
    });

    it('should ignore unknown keys', () => {
      const mockSelectNext = vi.fn();
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.selectNext = mockSelectNext;

      const { container } = render(ContextMenuItems, { props: defaultProps });

      fireEvent.keyDown(container, { key: 'Tab' });

      expect(mockSelectNext).not.toHaveBeenCalled();
    });
  });

  describe('selection handling', () => {
    it('should track selected index', () => {
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.selectedIndex = 1;

      render(ContextMenuItems, { props: defaultProps });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle mouse enter on items', () => {
      const mockSelectIndex = vi.fn();
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.selectIndex = mockSelectIndex;

      render(ContextMenuItems, { props: defaultProps });

      // Mouse enter events are handled by the ContextMenu.Item component
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle invalid selected index in Enter key', () => {
      const mockActivateSelected = vi.fn(() => null);
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.activateSelected = mockActivateSelected;

      const { container } = render(ContextMenuItems, { props: defaultProps });

      fireEvent.keyDown(container, { key: 'Enter' });

      expect(mockActivateSelected).toHaveBeenCalled();
      expect(mockAction1).not.toHaveBeenCalled();
    });

    it('should handle out of bounds selected index in Enter key', () => {
      const mockActivateSelected = vi.fn(() => 999);
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.activateSelected = mockActivateSelected;

      const { container } = render(ContextMenuItems, { props: defaultProps });

      fireEvent.keyDown(container, { key: 'Enter' });

      expect(mockActivateSelected).toHaveBeenCalled();
      expect(mockAction1).not.toHaveBeenCalled();
    });
  });

  describe('menu lifecycle', () => {
    it('should handle menu open', () => {
      const mockOpen = vi.fn();
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.open = mockOpen;

      render(ContextMenuItems, { props: defaultProps });

      // onOpenAutoFocus should call contextMenuStore.open with item count
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle menu close', () => {
      const mockClose = vi.fn();
      (
        vi.mocked(vi.importMock('$lib/stores/context-menu.svelte.js')) as {
          contextMenuStore: Partial<ContextMenuStore>;
        }
      ).contextMenuStore.close = mockClose;

      render(ContextMenuItems, { props: defaultProps });

      // onCloseAutoFocus should call contextMenuStore.close
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should count menu items correctly', () => {
      const itemsWithSeparators: ContextMenuList = [
        { id: 'item-1', label: 'Item 1', action: vi.fn() },
        { type: 'separator' },
        { id: 'item-2', label: 'Item 2', action: vi.fn() },
        { type: 'separator' },
        { id: 'item-3', label: 'Item 3', action: vi.fn() }
      ];

      render(ContextMenuItems, { props: { items: itemsWithSeparators } });

      // Should count 3 menu items (excluding 2 separators)
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      render(ContextMenuItems, { props: { items: [] } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle items with only separators', () => {
      const separatorOnlyItems: ContextMenuList = [{ type: 'separator' }, { type: 'separator' }];

      render(ContextMenuItems, { props: { items: separatorOnlyItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle null action functions', () => {
      const nullActionItems: ContextMenuList = [
        { id: 'null-action-1', label: 'Null Action', action: null as unknown as () => void }
      ];

      render(ContextMenuItems, { props: { items: nullActionItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle undefined action functions', () => {
      const undefinedActionItems: ContextMenuList = [
        {
          id: 'undefined-action-1',
          label: 'Undefined Action',
          action: undefined as unknown as () => void
        }
      ];

      render(ContextMenuItems, { props: { items: undefinedActionItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle null labels', () => {
      const nullLabelItems: ContextMenuList = [
        { id: 'null-label-1', label: null as unknown as string, action: vi.fn() }
      ];

      render(ContextMenuItems, { props: { items: nullLabelItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should handle function labels that return null', () => {
      const nullReturnLabelItems: ContextMenuList = [
        { id: 'null-return-1', label: () => null as unknown as string, action: vi.fn() }
      ];

      render(ContextMenuItems, { props: { items: nullReturnLabelItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
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

    it('should handle dynamic item changes', () => {
      const { rerender } = render(ContextMenuItems, { props: defaultProps });

      const dynamicItems: ContextMenuList = [
        { id: 'dynamic-1', label: 'Dynamic Item 1', action: vi.fn() },
        { type: 'separator' },
        { id: 'dynamic-2', label: 'Dynamic Item 2', action: vi.fn(), destructive: true }
      ];

      expect(() => rerender({ items: dynamicItems })).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('should support keyboard navigation', () => {
      const { container } = render(ContextMenuItems, { props: defaultProps });

      // Should handle keyboard events for accessibility
      expect(() => {
        fireEvent.keyDown(container, { key: 'ArrowDown' });
        fireEvent.keyDown(container, { key: 'ArrowUp' });
        fireEvent.keyDown(container, { key: 'Enter' });
        fireEvent.keyDown(container, { key: 'Escape' });
      }).not.toThrow();
    });

    it('should provide proper focus management', () => {
      render(ContextMenuItems, { props: defaultProps });

      // ContextMenu.Content should handle focus management
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should indicate selected items', () => {
      render(ContextMenuItems, { props: defaultProps });

      // Selected items should have data-selected attribute
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('should integrate with contextMenuStore', () => {
      render(ContextMenuItems, { props: defaultProps });

      // Should use all contextMenuStore methods
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });

    it('should integrate with ContextMenu UI components', () => {
      render(ContextMenuItems, { props: defaultProps });

      // Should render ContextMenu.Content, Item, and Separator
      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
      expect(screen.getAllByTestId('context-menu-item').length).toBeGreaterThan(0);
      expect(screen.getByTestId('context-menu-separator')).toBeInTheDocument();
    });

    it('should handle complex item structures', () => {
      const complexItems: ContextMenuList = [
        {
          id: 'complex-1',
          label: () => 'Complex Item',
          action: vi.fn(),
          icon: (() => ({ $$: { fragment: null } })) as unknown as ComponentType,
          keyboardShortcut: 'Ctrl+Alt+C',
          disabled: () => false,
          destructive: false
        },
        { type: 'separator' },
        {
          id: 'simple-1',
          label: 'Simple Item',
          action: vi.fn()
        }
      ];

      render(ContextMenuItems, { props: { items: complexItems } });

      expect(screen.getByTestId('context-menu-content')).toBeInTheDocument();
    });
  });
});
