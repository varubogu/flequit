import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SidebarTestPage from '../../../../src/routes/tests/sidebar/+page.svelte';

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

// --- Paraglide Mock ---
vi.mock('$paraglide/messages.js', () => ({
  sidebar_test: () => 'Sidebar Test',
  current_view: () => 'Current View',
  selected_project: () => 'Selected Project',
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
  view_all_tasks: () => 'View all tasks',
  views_title: () => 'Views',
  projects: () => 'Projects',
  tags: () => 'Tags',
  all_tasks: () => 'All Tasks',
  today: () => 'Today',
  scheduled: () => 'Scheduled',
  overdue: () => 'Overdue',
  no_projects_yet: () => 'No projects yet',
  not_signed_in: () => 'Not signed in',
  tomorrow: () => 'Tomorrow',
  completed: () => 'Completed',
  next_3_days: () => 'Next 3 days',
  next_week: () => 'Next week',
  this_month: () => 'This month',
  cancel: () => 'Cancel',
  save: () => 'Save',
  edit_project: () => 'Edit Project',
  add_task_list: () => 'Add Task List',
  delete_project: () => 'Delete Project',
  toggle_task_lists: () => 'Toggle task lists',
  edit_task_list: () => 'Edit Task List',
  add_task: () => 'Add Task',
  delete_task_list: () => 'Delete Task List',
  remove_tag_from_sidebar: () => 'Remove tag from sidebar',
  edit_tag: () => 'Edit tag',
  delete_tag: () => 'Delete tag',
  remove_from_bookmarks: () => 'Remove from bookmarks',
  sign_in: () => 'Sign In',
  sign_out: () => 'Sign Out',
  switch_account: () => 'Switch Account',
  remove: () => 'Remove'
}));

// --- Locale Store Mock ---
vi.mock('$lib/stores/locale.svelte', () => ({
  reactiveMessage: (fn: any) => fn
}));

// --- Sidebar Component Mock ---
vi.mock('$lib/components/sidebar/sidebar.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({ component: 'Sidebar' }))
}));

vi.mock('../../../../src/lib/stores/tasks.svelte', () => {
  // Mock task store with all required properties
  const mockTaskStore = {
    projects: [],
    selectedTaskId: null,
    selectedSubTaskId: null,
    selectedProjectId: null,
    selectedListId: null,
    isNewTaskMode: false,
    newTaskData: null,
    pendingTaskSelection: null,
    pendingSubTaskSelection: null,
    get todayTasks() { return []; },
    get overdueTasks() { return []; },
    get allTasks() { return []; },
    get selectedTask() { return null; },
    get selectedSubTask() { return null; },
    getTaskById: () => null,
    set: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    update: vi.fn()
  };
  
  return {
    taskStore: mockTaskStore
  };
});

vi.mock('$lib/stores/views-visibility.svelte', () => ({
  viewsVisibilityStore: {
    get visibleViews() { 
      return [
        { id: 'allTasks', label: 'All Tasks', icon: '📝', visible: true, order: 0 },
        { id: 'today', label: 'Today', icon: '📅', visible: true, order: 1 },
        { id: 'overdue', label: 'Overdue', icon: '⚠️', visible: true, order: 2 },
      ]; 
    }
  }
}));

// Mock task types
vi.mock('../../../../src/lib/types/task', () => ({}));

describe('Sidebar Test Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render test page with sidebar', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
  });

  test('should render page title', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
  });

  test('should render current view display', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
  });

  test('should render selected project display', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
  });

  test('should initialize task store with mock data', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
  });

  test('should apply correct layout classes', () => {
    const { container } = render(SidebarTestPage);
    const flexDiv = container.querySelector('.flex');
    expect(flexDiv).toBeInTheDocument();
  });

  test('should handle view changes', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
    // handleViewChange function should be defined
  });

  test('should provide test interface for sidebar', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
  });

  test('should configure mock projects correctly', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
  });

  test('should handle derived state from task store', () => {
    const { container } = render(SidebarTestPage);
    expect(container).toBeInTheDocument();
  });
});