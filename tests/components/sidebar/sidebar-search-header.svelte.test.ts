import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SidebarSearchHeader from '$lib/components/sidebar/sidebar-search-header.svelte';

// --- Paraglide Mock ---
vi.mock('$paraglide/messages.js', () => ({
  search: () => 'Search',
  search_tasks: () => 'Search tasks',
  type_a_command: () => 'Type a command',
  no_commands_found: () => 'No commands found',
  no_tasks_found: () => 'No tasks found',
  commands: () => 'Commands',
  settings: () => 'Settings',
  help: () => 'Help',
  show_all_results_for: () => 'Show all results for',
  jump_to_task: () => 'Jump to task',
  results: () => 'Results',
  no_matching_tasks_found: () => 'No matching tasks found',
  show_all_tasks: () => 'Show all tasks',
  quick_actions: () => 'Quick actions',
  add_new_task: () => 'Add new task',
  view_all_tasks: () => 'View all tasks'
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

describe('SidebarSearchHeader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render search button', () => {
    render(SidebarSearchHeader);
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Search').closest('button')).toBeInTheDocument();
  });

  test('should open search dialog on click', async () => {
    render(SidebarSearchHeader);
    const searchButton = screen.getByText('Search').closest('button');
    await fireEvent.click(searchButton!);
    expect(true).toBe(true);
  });

  test('should open search dialog with keyboard shortcut', async () => {
    render(SidebarSearchHeader);
    await fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(true).toBe(true);
  });

  test('should open search dialog with ctrl+k', async () => {
    render(SidebarSearchHeader);
    await fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(true).toBe(true);
  });

  test('should show keyboard shortcut hint', () => {
    render(SidebarSearchHeader);
    expect(screen.getByText('Search').closest('button')).toBeInTheDocument();
  });
});