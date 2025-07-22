import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Layout from '../../src/routes/+layout.svelte';

// Mock CSS import
vi.mock('../../src/app.css', () => ({}));

// Mock Svelte
vi.mock('svelte', () => ({
  onMount: vi.fn((fn) => fn()) // Immediately call the function for testing
}));

// Mock DataService
const mockDataService = {
  loadUserData: vi.fn()
};

vi.mock('../../src/lib/services/data-service', () => ({
  DataService: mockDataService
}));

// Mock ModeWatcher
vi.mock('mode-watcher', () => ({
  ModeWatcher: vi.fn().mockImplementation(() => ({
    component: 'ModeWatcher'
  }))
}));

// Mock ContextMenu
vi.mock('../../src/lib/components/context-menu.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({
    component: 'ContextMenu'
  }))
}));

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render layout with correct structure', () => {
    const { container } = render(Layout);
    expect(container).toBeInTheDocument();
  });

  test('should call DataService.loadUserData on mount', () => {
    render(Layout);
    expect(mockDataService.loadUserData).toHaveBeenCalledOnce();
  });

  test('should render ModeWatcher component', () => {
    const { container } = render(Layout);
    expect(container).toBeInTheDocument();
  });

  test('should render ContextMenu component', () => {
    const { container } = render(Layout);
    expect(container).toBeInTheDocument();
  });

  test('should apply correct CSS classes to main container', () => {
    const { container } = render(Layout);
    const mainDiv = container.querySelector('div');
    expect(mainDiv).toHaveClass('min-h-screen', 'bg-background', 'text-foreground');
  });

  test('should render slot content', () => {
    const { container } = render(Layout, {
      children: () => 'Test Content'
    });
    expect(container).toBeInTheDocument();
  });

  test('should initialize data loading correctly', () => {
    render(Layout);
    expect(mockDataService.loadUserData).toHaveBeenCalled();
  });

  test('should handle mount lifecycle correctly', () => {
    const { container } = render(Layout);
    expect(container).toBeInTheDocument();
    expect(mockDataService.loadUserData).toHaveBeenCalledOnce();
  });
});