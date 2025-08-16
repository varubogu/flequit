import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SettingsDraggableItemsContent from '$lib/components/settings/settings-draggable-items-content.svelte';

// Mock drag and drop library
vi.mock('@thisux/sveltednd', () => ({
  draggable: () => ({}),
  droppable: () => ({})
}));

vi.mock('lucide-svelte', () => ({
  GripVertical: () => ({ $$: { fragment: null } })
}));

describe('SettingsDraggableItemsContent', () => {
  const mockItems = [
    {
      id: 'item-1',
      label: 'Item 1',
      icon: '📋',
      visible: true
    },
    {
      id: 'item-2',
      label: 'Item 2',
      icon: '📝',
      visible: true
    },
    {
      id: 'item-3',
      label: 'Item 3',
      icon: '🗂️',
      visible: false
    }
  ];

  const mockDragState = {
    isDragging: false,
    draggedItem: null,
    dropZone: null,
    insertIndex: -1
  };

  const mockLogic = {
    localVisibleItems: [mockItems[0], mockItems[1]],
    localHiddenItems: [mockItems[2]],
    dragState: mockDragState,
    visibleInSidebar: vi.fn(() => 'Visible in Sidebar'),
    hiddenFromSidebar: vi.fn(() => 'Hidden from Sidebar'),
    handleDrop: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn()
  };

  const defaultProps = {
    logic: mockLogic
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogic.dragState = { ...mockDragState };
    mockLogic.localVisibleItems = [mockItems[0], mockItems[1]];
    mockLogic.localHiddenItems = [mockItems[2]];
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      const gridContainer = document.querySelector('.grid.grid-cols-1.gap-6.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should render visible and hidden sections', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      expect(screen.getByText('Visible in Sidebar')).toBeInTheDocument();
      expect(screen.getByText('Hidden from Sidebar')).toBeInTheDocument();
    });

    it('should render items in correct sections', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      expect(screen.getByText('📋 Item 1')).toBeInTheDocument();
      expect(screen.getByText('📝 Item 2')).toBeInTheDocument();
      expect(screen.getByText('🗂️ Item 3')).toBeInTheDocument();
    });
  });

  describe('visible items section', () => {
    it('should render visible items correctly', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      const visibleItems = screen.getAllByText(/📋 Item 1|📝 Item 2/);
      expect(visibleItems).toHaveLength(2);
    });

    it('should handle empty visible items', () => {
      const logicWithEmptyVisible = {
        ...mockLogic,
        localVisibleItems: []
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: logicWithEmptyVisible }
      });
      
      expect(screen.getByText('Visible in Sidebar')).toBeInTheDocument();
    });

    it('should show drop zone highlighting when dragging to visible', () => {
      const draggingLogic = {
        ...mockLogic,
        dragState: {
          ...mockDragState,
          isDragging: true,
          dropZone: 'visible'
        }
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: draggingLogic }
      });
      
      const visibleDropZone = document.querySelector('.bg-background');
      expect(visibleDropZone).toHaveClass('border-primary', 'bg-primary/5');
    });

    it('should handle drag state for visible items', () => {
      const draggingLogic = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          draggedItem: mockItems[0],
          dropZone: 'visible',
          insertIndex: 0
        }
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: draggingLogic }
      });
      
      const draggedItem = document.querySelector(`[data-item-id="${mockItems[0].id}"]`);
      expect(draggedItem).toHaveClass('opacity-50');
    });
  });

  describe('hidden items section', () => {
    it('should render hidden items correctly', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      expect(screen.getByText('🗂️ Item 3')).toBeInTheDocument();
    });

    it('should handle empty hidden items', () => {
      const logicWithEmptyHidden = {
        ...mockLogic,
        localHiddenItems: []
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: logicWithEmptyHidden }
      });
      
      expect(screen.getByText('Hidden from Sidebar')).toBeInTheDocument();
    });

    it('should show drop zone highlighting when dragging to hidden', () => {
      const draggingLogic = {
        ...mockLogic,
        dragState: {
          ...mockDragState,
          isDragging: true,
          dropZone: 'hidden'
        }
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: draggingLogic }
      });
      
      const hiddenDropZone = document.querySelector('.bg-muted\\/50');
      expect(hiddenDropZone).toHaveClass('border-primary', 'bg-primary/5');
    });

    it('should handle drag state for hidden items', () => {
      const draggingLogic = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          draggedItem: mockItems[2],
          dropZone: 'hidden',
          insertIndex: 0
        }
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: draggingLogic }
      });
      
      const draggedItem = document.querySelector(`[data-item-id="${mockItems[2].id}"]`);
      expect(draggedItem).toHaveClass('opacity-50');
    });
  });

  describe('drag and drop indicators', () => {
    it('should show drop indicator at specific index in visible zone', () => {
      const draggingLogic = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          draggedItem: mockItems[2],
          dropZone: 'visible',
          insertIndex: 1
        }
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: draggingLogic }
      });
      
      const dropIndicator = document.querySelector('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicator).toBeInTheDocument();
    });

    it('should show drop indicator at end in visible zone', () => {
      const draggingLogic = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          draggedItem: mockItems[2],
          dropZone: 'visible',
          insertIndex: 10 // Beyond array length
        }
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: draggingLogic }
      });
      
      const dropIndicators = document.querySelectorAll('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicators.length).toBeGreaterThan(0);
    });

    it('should show drop indicator in hidden zone', () => {
      const draggingLogic = {
        ...mockLogic,
        dragState: {
          isDragging: true,
          draggedItem: mockItems[0],
          dropZone: 'hidden',
          insertIndex: 0
        }
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: draggingLogic }
      });
      
      const dropIndicator = document.querySelector('.bg-primary.mx-2.my-1.h-0\\.5.rounded-full');
      expect(dropIndicator).toBeInTheDocument();
    });
  });

  describe('item structure', () => {
    it('should render items with correct structure', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      const itemElement = document.querySelector(`[data-item-id="${mockItems[0].id}"]`);
      expect(itemElement).toHaveClass('bg-card', 'hover:bg-muted', 'flex', 'cursor-grab');
    });

    it('should render item icons and labels', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      const item1 = screen.getByText('📋 Item 1');
      expect(item1).toHaveClass('flex-1', 'text-sm');
    });

    it('should include grip handles for dragging', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      // GripVertical icons are mocked, but containers should exist
      const items = document.querySelectorAll('[data-item-id]');
      expect(items.length).toBe(3);
    });
  });

  describe('logic integration', () => {
    it('should call translation functions', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      expect(mockLogic.visibleInSidebar).toHaveBeenCalled();
      expect(mockLogic.hiddenFromSidebar).toHaveBeenCalled();
    });

    it('should setup drop zone callbacks', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      // Drag and drop setup should not throw errors
      expect(document.querySelector('.grid')).toBeInTheDocument();
    });

    it('should setup draggable callbacks', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      // All items should have data-item-id attributes
      const draggableItems = document.querySelectorAll('[data-item-id]');
      expect(draggableItems).toHaveLength(3);
    });
  });

  describe('responsive layout', () => {
    it('should have responsive grid classes', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('should maintain layout with many items', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        label: `Item ${i}`,
        icon: '📋',
        visible: i < 10
      }));

      const logicWithManyItems = {
        ...mockLogic,
        localVisibleItems: manyItems.slice(0, 10),
        localHiddenItems: manyItems.slice(10)
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: logicWithManyItems }
      });
      
      expect(document.querySelectorAll('[data-item-id]')).toHaveLength(20);
    });
  });

  describe('edge cases', () => {
    it('should handle items with empty labels', () => {
      const itemsWithEmptyLabel = [
        { ...mockItems[0], label: '' },
        { ...mockItems[1], label: '' }
      ];

      const logicWithEmptyLabels = {
        ...mockLogic,
        localVisibleItems: itemsWithEmptyLabel,
        localHiddenItems: []
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: logicWithEmptyLabels }
      });
      
      expect(document.querySelectorAll('[data-item-id]')).toHaveLength(2);
    });

    it('should handle items with special characters', () => {
      const specialItems = [
        { id: 'special-1', label: 'Item with 特殊文字', icon: '🎯', visible: true },
        { id: 'special-2', label: 'Item & symbols!@#', icon: '💫', visible: false }
      ];

      const logicWithSpecialItems = {
        ...mockLogic,
        localVisibleItems: [specialItems[0]],
        localHiddenItems: [specialItems[1]]
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: logicWithSpecialItems }
      });
      
      expect(screen.getByText('🎯 Item with 特殊文字')).toBeInTheDocument();
      expect(screen.getByText('💫 Item & symbols!@#')).toBeInTheDocument();
    });

    it('should handle null drag state', () => {
      const logicWithNullDragState = {
        ...mockLogic,
        dragState: {
          isDragging: false,
          draggedItem: null,
          dropZone: null,
          insertIndex: -1
        }
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: logicWithNullDragState }
      });
      
      expect(document.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should provide proper headings structure', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      const headings = document.querySelectorAll('h4');
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveClass('mb-3', 'text-base', 'font-medium');
    });

    it('should maintain keyboard accessibility', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      // Items should be draggable (cursor-grab class)
      const draggableItems = document.querySelectorAll('.cursor-grab');
      expect(draggableItems.length).toBeGreaterThan(0);
    });

    it('should provide visual feedback for interactions', () => {
      render(SettingsDraggableItemsContent, { props: defaultProps });
      
      const items = document.querySelectorAll('.hover\\:bg-muted');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(SettingsDraggableItemsContent, { props: defaultProps });
      
      expect(document.querySelector('.grid')).toBeInTheDocument();
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { unmount } = render(SettingsDraggableItemsContent, { props: defaultProps });
      
      unmount();
      
      const updatedLogic = {
        ...mockLogic,
        localVisibleItems: [mockItems[2]],
        localHiddenItems: [mockItems[0], mockItems[1]]
      };

      render(SettingsDraggableItemsContent, { 
        props: { logic: updatedLogic }
      });
      
      expect(screen.getByText('🗂️ Item 3')).toBeInTheDocument();
    });
  });
});