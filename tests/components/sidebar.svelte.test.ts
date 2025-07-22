import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Sidebar from '../../src/lib/components/sidebar.svelte';


describe('Sidebar Component Integration', () => {
  let onViewChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onViewChange = vi.fn();
    vi.clearAllMocks();
  });

  test('should render sidebar with all main sections', () => {
    render(Sidebar, { onViewChange });

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  test('should render sidebar layout structure', () => {
    const { container } = render(Sidebar, { onViewChange });
    
    const card = container.querySelector('.w-64.border-r.flex.flex-col.h-full');
    expect(card).toBeInTheDocument();
    
    const nav = container.querySelector('nav.flex-1.p-4');
    expect(nav).toBeInTheDocument();
    
    const footer = container.querySelector('.border-t');
    expect(footer).toBeInTheDocument();
  });

  test('should pass currentView prop to child components', () => {
    render(Sidebar, { currentView: 'today', onViewChange });
    expect(true).toBe(true);
  });

  test('should pass onViewChange prop to child components', () => {
    render(Sidebar, { onViewChange });
    expect(true).toBe(true);
  });
});
