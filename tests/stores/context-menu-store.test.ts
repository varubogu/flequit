import { describe, test, expect, beforeEach, vi } from 'vitest';
import { contextMenuStore, type MenuItem } from '../../src/lib/stores/context-menu.svelte';

describe('ContextMenuStore', () => {
  beforeEach(() => {
    // Close the context menu before each test
    contextMenuStore.close();
  });
  
  describe('initial state', () => {
    test('should initialize with closed state', () => {
      const state = contextMenuStore.state;
      
      expect(state.show).toBe(false);
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.options).toEqual([]);
    });
  });
  
  describe('open', () => {
    test('should open context menu with specified position and options', () => {
      const mockAction = vi.fn();
      const options: MenuItem[] = [
        {
          label: 'Edit',
          action: mockAction
        },
        {
          label: 'Delete',
          action: mockAction,
          disabled: true
        },
        {
          label: 'Separator',
          action: mockAction,
          separator: true
        }
      ];
      
      contextMenuStore.open(100, 200, options);
      
      const state = contextMenuStore.state;
      expect(state.show).toBe(true);
      expect(state.x).toBe(100);
      expect(state.y).toBe(200);
      expect(state.options).toEqual(options);
    });
    
    test('should update position and options when called multiple times', () => {
      const firstOptions: MenuItem[] = [
        {
          label: 'First',
          action: vi.fn()
        }
      ];
      
      const secondOptions: MenuItem[] = [
        {
          label: 'Second',
          action: vi.fn()
        }
      ];
      
      // Open first time
      contextMenuStore.open(50, 75, firstOptions);
      let state = contextMenuStore.state;
      expect(state.x).toBe(50);
      expect(state.y).toBe(75);
      expect(state.options).toEqual(firstOptions);
      
      // Open second time with different values
      contextMenuStore.open(150, 175, secondOptions);
      state = contextMenuStore.state;
      expect(state.x).toBe(150);
      expect(state.y).toBe(175);
      expect(state.options).toEqual(secondOptions);
      expect(state.show).toBe(true);
    });
  });
  
  describe('close', () => {
    test('should close the context menu', () => {
      // First open the menu
      const options: MenuItem[] = [
        {
          label: 'Test',
          action: vi.fn()
        }
      ];
      contextMenuStore.open(100, 200, options);
      
      // Verify it's open
      expect(contextMenuStore.state.show).toBe(true);
      
      // Close it
      contextMenuStore.close();
      
      // Verify it's closed
      expect(contextMenuStore.state.show).toBe(false);
    });
    
    test('should not affect position and options when closing', () => {
      const options: MenuItem[] = [
        {
          label: 'Test',
          action: vi.fn()
        }
      ];
      
      contextMenuStore.open(100, 200, options);
      contextMenuStore.close();
      
      const state = contextMenuStore.state;
      expect(state.show).toBe(false);
      expect(state.x).toBe(100); // Position should remain
      expect(state.y).toBe(200); // Position should remain
      expect(state.options).toEqual(options); // Options should remain
    });
  });
  
  describe('menu item functionality', () => {
    test('should handle menu items with different properties', () => {
      const actionSpy = vi.fn();
      const mockIcon = {} as any; // Mock component
      
      const options: MenuItem[] = [
        {
          label: 'Normal Item',
          action: actionSpy
        },
        {
          label: 'Disabled Item',
          action: actionSpy,
          disabled: true
        },
        {
          label: 'Item with Icon',
          action: actionSpy,
          icon: mockIcon
        },
        {
          label: 'Separator Item',
          action: actionSpy,
          separator: true
        }
      ];
      
      contextMenuStore.open(0, 0, options);
      
      const state = contextMenuStore.state;
      expect(state.options).toHaveLength(4);
      expect(state.options[0].disabled).toBeUndefined();
      expect(state.options[1].disabled).toBe(true);
      expect(state.options[2].icon).toStrictEqual(mockIcon);
      expect(state.options[3].separator).toBe(true);
      
      // Test that actions can be called
      state.options[0].action();
      expect(actionSpy).toHaveBeenCalledTimes(1);
    });
  });
});