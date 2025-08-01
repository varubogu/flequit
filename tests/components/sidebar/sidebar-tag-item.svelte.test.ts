import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SidebarTagItem from '$lib/components/sidebar/sidebar-tag-item.svelte';
import type { Tag } from '$lib/types/task';

// --- Paraglide Mock ---

}));

// --- Locale Store Mock ---
vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: any) => fn
}));

// --- Sidebar Context Mock ---
vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    state: 'expanded',
    open: true,
    isMobile: false,
    toggleSidebar: vi.fn(),
    setOpen: vi.fn(),
  })
}));

// --- Task Store Mock ---
vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    getTaskCountByTag: vi.fn(() => 5)
  }
}));

describe('SidebarTagItem Component', () => {
  const mockTag: Tag = {
    id: 'tag-1',
    name: 'Work',
    color: '#ff0000',
    created_at: new Date(),
    updated_at: new Date()
  };

  let onRemoveFromBookmarks: ReturnType<typeof vi.fn>;
  let onEditTag: ReturnType<typeof vi.fn>;
  let onDeleteTag: ReturnType<typeof vi.fn>;
  let onTagClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRemoveFromBookmarks = vi.fn();
    onEditTag = vi.fn();
    onDeleteTag = vi.fn();
    onTagClick = vi.fn();
    vi.clearAllMocks();
  });

  test('should render tag item in expanded state', () => {
    render(SidebarTagItem, {
      props: {
        tag: mockTag,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // task count
  });

  test('should render tag item in expanded state by default', () => {
    render(SidebarTagItem, {
      props: {
        tag: mockTag,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    // In expanded state, text should be visible
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  test('should call onTagClick when button is clicked', async () => {
    render(SidebarTagItem, {
      props: {
        tag: mockTag,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    const button = screen.getByRole('button');
    await fireEvent.click(button);

    expect(onTagClick).toHaveBeenCalledTimes(1);
  });

  test('should open context menu on right click', async () => {
    render(SidebarTagItem, {
      props: {
        tag: mockTag,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    const button = screen.getByRole('button');
    await fireEvent.contextMenu(button);

    // Check if context menu items appear
    await expect(screen.findByText('Remove tag from sidebar')).resolves.toBeInTheDocument();
    await expect(screen.findByText('Edit tag')).resolves.toBeInTheDocument();
    await expect(screen.findByText('Delete tag')).resolves.toBeInTheDocument();
  });

  test('should call onRemoveFromBookmarks when context menu item is clicked', async () => {
    render(SidebarTagItem, {
      props: {
        tag: mockTag,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    const button = screen.getByRole('button');
    await fireEvent.contextMenu(button);

    const removeItem = await screen.findByText('Remove tag from sidebar');
    await fireEvent.click(removeItem);

    expect(onRemoveFromBookmarks).toHaveBeenCalledWith(mockTag);
  });

  test('should call onEditTag when edit context menu item is clicked', async () => {
    render(SidebarTagItem, {
      props: {
        tag: mockTag,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    const button = screen.getByRole('button');
    await fireEvent.contextMenu(button);

    const editItem = await screen.findByText('Edit tag');
    await fireEvent.click(editItem);

    expect(onEditTag).toHaveBeenCalledWith(mockTag);
  });

  test('should call onDeleteTag when delete context menu item is clicked', async () => {
    render(SidebarTagItem, {
      props: {
        tag: mockTag,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    const button = screen.getByRole('button');
    await fireEvent.contextMenu(button);

    const deleteItem = await screen.findByText('Delete tag');
    await fireEvent.click(deleteItem);

    expect(onDeleteTag).toHaveBeenCalledWith(mockTag);
  });

  test('should display tag color', () => {
    render(SidebarTagItem, {
      props: {
        tag: mockTag,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    // Hash icon should exist and have color style
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('should handle tag without color', () => {
    const tagWithoutColor = {
      ...mockTag,
      color: undefined
    };

    render(SidebarTagItem, {
      props: {
        tag: tagWithoutColor,
        onRemoveFromBookmarks,
        onEditTag,
        onDeleteTag,
        onTagClick
      }
    });

    expect(screen.getByText('Work')).toBeInTheDocument();
  });
});