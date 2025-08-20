import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import SettingsDraggableItemsContent from '$lib/components/settings/draggable-items/settings-draggable-items-content.svelte';

// Mock dependencies
vi.mock('@thisux/sveltednd', () => ({
  draggable: () => ({ destroy: vi.fn() }),
  droppable: () => ({ destroy: vi.fn() })
}));

vi.mock('lucide-svelte', () => ({
  GripVertical: () => ({ $$: { fragment: null } })
}));

describe('SettingsDraggableItemsContent', () => {
  const mockVisibleItem = {
    id: 'visible-1',
    icon: '📋',
    label: 'Visible Item'
  };

  const mockHiddenItem = {
    id: 'hidden-1',
    icon: '🔒',
    label: 'Hidden Item'
  };

  const mockLogic = {
    localVisibleItems: [mockVisibleItem],
    localHiddenItems: [mockHiddenItem],
    dragState: {
      isDragging: false,
      dropZone: null,
      insertIndex: -1,
      draggedItem: null
    },
    visibleInSidebar: vi.fn(() => 'Visible in Sidebar') as ReturnType<typeof vi.fn>,
    hiddenFromSidebar: vi.fn(() => 'Hidden from Sidebar') as ReturnType<typeof vi.fn>,
    handleDrop: vi.fn() as ReturnType<typeof vi.fn>,
    handleDragOver: vi.fn() as ReturnType<typeof vi.fn>,
    handleDragStart: vi.fn() as ReturnType<typeof vi.fn>,
    handleDragEnd: vi.fn() as ReturnType<typeof vi.fn>
  };

  const defaultProps = {
    logic: mockLogic as unknown as any
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogic.dragState = {
      isDragging: false,
      dropZone: null,
      insertIndex: -1,
      draggedItem: null
    };
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(SettingsDraggableItemsContent, { props: defaultProps });

      expect(container.innerHTML).toBeTruthy();
    });

    it('should render grid layout', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const grid = document.querySelector('.grid.grid-cols-1.gap-6.md\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should render visible and hidden sections', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      // Visible section title
      expect(mockLogic.visibleInSidebar).toHaveBeenCalled();
      // Hidden section title
      expect(mockLogic.hiddenFromSidebar).toHaveBeenCalled();
    });
  });

  describe('visible items section', () => {
    it('should render visible items section', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const visibleSection = document.querySelector('.bg-background.relative.min-h-\\[200px\\]');
      expect(visibleSection).toBeInTheDocument();
    });

    it('should render visible items', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const itemElement = document.querySelector('[data-item-id="visible-1"]');
      expect(itemElement).toBeInTheDocument();
    });

    it('should display visible item content correctly', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const itemElement = document.querySelector('[data-item-id="visible-1"]');
      expect(itemElement?.textContent).toContain('📋 Visible Item');
    });

    it('should apply normal styling when not dragging', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const dropZone = document.querySelector('.bg-background.relative.min-h-\\[200px\\]');
      expect(dropZone).not.toHaveClass('border-primary');
      expect(dropZone).not.toHaveClass('bg-primary/5');
    });
  });

  describe('hidden items section', () => {
    it('should render hidden items section', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const hiddenSection = document.querySelector('.bg-muted\\/50.relative.min-h-\\[200px\\]');
      expect(hiddenSection).toBeInTheDocument();
    });

    it('should render hidden items', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const itemElement = document.querySelector('[data-item-id="hidden-1"]');
      expect(itemElement).toBeInTheDocument();
    });

    it('should display hidden item content correctly', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const itemElement = document.querySelector('[data-item-id="hidden-1"]');
      expect(itemElement?.textContent).toContain('🔒 Hidden Item');
    });
  });

  describe('drag and drop states', () => {
    it('should apply dragging styles when dragging to visible zone', () => {
      const logicWithDrag = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          dropZone: 'visible',
          insertIndex: -1,
          draggedItem: mockVisibleItem
        }
      };

      render(SettingsDraggableItemsContent, { props: { logic: logicWithDrag as unknown as any } });

      const visibleDropZone = document.querySelector('.bg-background.relative.min-h-\\[200px\\]');
      expect(visibleDropZone).toHaveClass('border-primary');
      expect(visibleDropZone).toHaveClass('bg-primary/5');
    });

    it('should apply dragging styles when dragging to hidden zone', () => {
      const logicWithDrag = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          dropZone: 'hidden',
          insertIndex: -1,
          draggedItem: mockHiddenItem
        }
      };

      render(SettingsDraggableItemsContent, { props: { logic: logicWithDrag as unknown as any } });

      const hiddenDropZone = document.querySelector('.bg-muted\\/50.relative.min-h-\\[200px\\]');
      expect(hiddenDropZone).toHaveClass('border-primary');
      expect(hiddenDropZone).toHaveClass('bg-primary/5');
    });

    it('should apply opacity to dragged item', () => {
      const logicWithDraggedItem = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          dropZone: 'visible',
          insertIndex: -1,
          draggedItem: mockVisibleItem
        }
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithDraggedItem as unknown as any }
      });

      const draggedElement = document.querySelector('[data-item-id="visible-1"]');
      expect(draggedElement).toHaveClass('opacity-50');
    });

    it('should show drop indicator at specific index in visible zone', () => {
      const logicWithDropIndicator = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          dropZone: 'visible',
          insertIndex: 0,
          draggedItem: mockHiddenItem
        }
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithDropIndicator as unknown as any }
      });

      const dropIndicator = document.querySelector('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicator).toBeInTheDocument();
    });

    it('should show drop indicator at specific index in hidden zone', () => {
      const logicWithDropIndicator = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          dropZone: 'hidden',
          insertIndex: 0,
          draggedItem: mockVisibleItem
        }
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithDropIndicator as unknown as any }
      });

      const dropIndicator = document.querySelector('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicator).toBeInTheDocument();
    });
  });

  describe('multiple items rendering', () => {
    it('should render multiple visible items', () => {
      const logicWithMultipleVisible = {
        ...mockLogic,
        localVisibleItems: [
          mockVisibleItem,
          { id: 'visible-2', icon: '📅', label: 'Calendar' },
          { id: 'visible-3', icon: '✅', label: 'Tasks' }
        ]
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithMultipleVisible as unknown as any }
      });

      expect(document.querySelector('[data-item-id="visible-1"]')).toBeInTheDocument();
      expect(document.querySelector('[data-item-id="visible-2"]')).toBeInTheDocument();
      expect(document.querySelector('[data-item-id="visible-3"]')).toBeInTheDocument();
    });

    it('should render multiple hidden items', () => {
      const logicWithMultipleHidden = {
        ...mockLogic,
        localHiddenItems: [
          mockHiddenItem,
          { id: 'hidden-2', icon: '📊', label: 'Reports' },
          { id: 'hidden-3', icon: '⚙️', label: 'Settings' }
        ]
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithMultipleHidden as unknown as any }
      });

      expect(document.querySelector('[data-item-id="hidden-1"]')).toBeInTheDocument();
      expect(document.querySelector('[data-item-id="hidden-2"]')).toBeInTheDocument();
      expect(document.querySelector('[data-item-id="hidden-3"]')).toBeInTheDocument();
    });
  });

  describe('empty state handling', () => {
    it('should render empty visible items section', () => {
      const logicWithEmpty = {
        ...mockLogic,
        localVisibleItems: [],
        localHiddenItems: []
      };

      render(SettingsDraggableItemsContent, { props: { logic: logicWithEmpty as unknown as any } });

      const visibleSection = document.querySelector('.bg-background.relative.min-h-\\[200px\\]');
      const hiddenSection = document.querySelector('.bg-muted\\/50.relative.min-h-\\[200px\\]');

      expect(visibleSection).toBeInTheDocument();
      expect(hiddenSection).toBeInTheDocument();
    });

    it('should show drop indicator in empty visible zone', () => {
      const logicWithEmptyAndDrag = {
        ...mockLogic,
        localVisibleItems: [],
        dragState: {
          isDragging: true,
          dropZone: 'visible',
          insertIndex: -1,
          draggedItem: mockHiddenItem
        }
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithEmptyAndDrag as unknown as any }
      });

      const dropIndicator = document.querySelector('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicator).toBeInTheDocument();
    });

    it('should show drop indicator in empty hidden zone', () => {
      const logicWithEmptyAndDrag = {
        ...mockLogic,
        localHiddenItems: [],
        dragState: {
          isDragging: true,
          dropZone: 'hidden',
          insertIndex: -1,
          draggedItem: mockVisibleItem
        }
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithEmptyAndDrag as unknown as any }
      });

      const dropIndicator = document.querySelector('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicator).toBeInTheDocument();
    });
  });

  describe('item content display', () => {
    it('should display item icon and label', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const visibleItem = document.querySelector('[data-item-id="visible-1"] span');
      const hiddenItem = document.querySelector('[data-item-id="hidden-1"] span');

      expect(visibleItem?.textContent).toBe('📋 Visible Item');
      expect(hiddenItem?.textContent).toBe('🔒 Hidden Item');
    });

    it('should display items with special characters', () => {
      const logicWithSpecialChars = {
        ...mockLogic,
        localVisibleItems: [
          {
            id: 'special-1',
            icon: '🌟',
            label: 'Special & Important <Task>'
          }
        ]
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithSpecialChars as unknown as any }
      });

      const item = document.querySelector('[data-item-id="special-1"] span');
      expect(item?.textContent).toBe('🌟 Special & Important <Task>');
    });

    it('should handle long item labels', () => {
      const logicWithLongLabel = {
        ...mockLogic,
        localVisibleItems: [
          {
            id: 'long-1',
            icon: '📝',
            label: 'Very Long Item Label That Should Be Handled Properly In The UI'
          }
        ]
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithLongLabel as unknown as any }
      });

      const item = document.querySelector('[data-item-id="long-1"] span');
      expect(item?.textContent).toContain('Very Long Item Label');
    });
  });

  describe('drag state edge cases', () => {
    it('should handle null draggedItem', () => {
      const logicWithNullDrag = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          dropZone: 'visible',
          insertIndex: 0,
          draggedItem: null
        }
      };

      const { container } = render(SettingsDraggableItemsContent, {
        props: { logic: logicWithNullDrag as unknown as any }
      });
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle insertIndex beyond array length', () => {
      const logicWithHighIndex = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          dropZone: 'visible',
          insertIndex: 999,
          draggedItem: mockHiddenItem
        }
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithHighIndex as unknown as any }
      });

      const dropIndicator = document.querySelector('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicator).toBeInTheDocument();
    });

    it('should handle negative insertIndex', () => {
      const logicWithNegativeIndex = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          dropZone: 'hidden',
          insertIndex: -5,
          draggedItem: mockVisibleItem
        }
      };

      render(SettingsDraggableItemsContent, {
        props: { logic: logicWithNegativeIndex as unknown as any }
      });

      const dropIndicator = document.querySelector('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicator).toBeInTheDocument();
    });
  });

  describe('component structure', () => {
    it('should have proper grid layout classes', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const grid = document.querySelector('.grid.grid-cols-1.gap-6.md\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should have proper item styling classes', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const visibleItem = document.querySelector('[data-item-id="visible-1"]');
      expect(visibleItem).toHaveClass('bg-card');
      expect(visibleItem).toHaveClass('hover:bg-muted');
      expect(visibleItem).toHaveClass('flex');
      expect(visibleItem).toHaveClass('cursor-grab');
      expect(visibleItem).toHaveClass('items-center');
    });

    it('should have proper drop zone styling', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });

      const visibleDropZone = document.querySelector('.bg-background.relative.min-h-\\[200px\\]');
      const hiddenDropZone = document.querySelector('.bg-muted\\/50.relative.min-h-\\[200px\\]');

      expect(visibleDropZone).toHaveClass('space-y-1');
      expect(visibleDropZone).toHaveClass('rounded-lg');
      expect(visibleDropZone).toHaveClass('border');
      expect(visibleDropZone).toHaveClass('p-2');

      expect(hiddenDropZone).toHaveClass('space-y-1');
      expect(hiddenDropZone).toHaveClass('rounded-lg');
      expect(hiddenDropZone).toHaveClass('border');
      expect(hiddenDropZone).toHaveClass('p-2');
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(SettingsDraggableItemsContent, { props: defaultProps });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(SettingsDraggableItemsContent, { props: defaultProps });

      const updatedLogic = {
        ...mockLogic,
        localVisibleItems: [{ id: 'updated-1', icon: '🔄', label: 'Updated Item' }]
      };

      expect(() => rerender({ logic: updatedLogic as unknown as any })).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle missing logic properties gracefully', () => {
      const incompleteLogic = {
        localVisibleItems: [],
        localHiddenItems: [],
        dragState: { isDragging: false },
        visibleInSidebar: vi.fn(() => 'Visible') as ReturnType<typeof vi.fn>,
        hiddenFromSidebar: vi.fn(() => 'Hidden') as ReturnType<typeof vi.fn>
        // Missing some methods intentionally
      } as unknown as unknown as any;

      const { container } = render(SettingsDraggableItemsContent, {
        props: { logic: incompleteLogic }
      });
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle malformed items', () => {
      const logicWithBadItems = {
        ...mockLogic,
        localVisibleItems: [
          { id: null, icon: null, label: null } as unknown as any,
          { id: '', icon: '', label: '' },
          mockVisibleItem
        ]
      };

      const { container } = render(SettingsDraggableItemsContent, {
        props: { logic: logicWithBadItems as unknown as any }
      });
      expect(container.innerHTML).toBeTruthy();
    });
  });
});
