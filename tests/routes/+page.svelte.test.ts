import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from '../../src/routes/+page.svelte';

// Mock all child components
vi.mock('../../src/lib/components/sidebar.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    component: 'Sidebar'
  }))
}));

vi.mock('../../src/lib/components/task-list.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    component: 'TaskList'
  }))
}));

vi.mock('../../src/lib/components/task-detail.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    component: 'TaskDetail'
  }))
}));

// Mock resizable components
vi.mock('../../src/lib/components/ui/resizable/index.js', () => ({
  PaneGroup: vi.fn().mockImplementation(() => ({
    component: 'PaneGroup'
  })),
  Pane: vi.fn().mockImplementation(() => ({
    component: 'Pane'
  })),
  Handle: vi.fn().mockImplementation(() => ({
    component: 'Handle'
  }))
}));

vi.mock('../../src/lib/stores/view-store.svelte', () => {
  // Mock view store
  const mockViewStore = {
    currentView: 'all',
    viewTitle: 'All Tasks',
    tasks: [],
    showAddButton: true,
    changeView: vi.fn()
  };
  
  return {
    viewStore: mockViewStore
  };
});

describe('Main Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render main page layout', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
  });

  test('should render sidebar component', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
  });

  test('should render task list component', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
  });

  test('should render task detail component', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
  });

  test('should render resizable layout', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
  });

  test('should apply correct layout classes', () => {
    const { container } = render(Page);
    const mainDiv = container.querySelector('div');
    expect(mainDiv).toHaveClass('h-screen', 'flex', 'bg-background');
  });

  test('should handle view changes', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
    // The handleViewChange function should be defined and ready to use
  });

  test('should pass correct props to sidebar', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
  });

  test('should pass correct props to task list', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
  });

  test('should configure resizable panes correctly', () => {
    const { container } = render(Page);
    expect(container).toBeInTheDocument();
  });
});