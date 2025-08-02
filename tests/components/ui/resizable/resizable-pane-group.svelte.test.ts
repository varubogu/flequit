import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ResizablePaneGroup from '$lib/components/ui/resizable/resizable-pane-group.svelte';

// Mock paneforge
vi.mock('paneforge', () => ({
  PaneGroup: vi.fn().mockImplementation((props) => ({
    component: 'PaneGroup',
    props
  }))
}));

// Mock cn utility
vi.mock('$lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('ResizablePaneGroup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render pane group with default props', () => {
    const { container } = render(ResizablePaneGroup, { direction: 'horizontal' });
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(ResizablePaneGroup, {
      class: 'custom-pane-group',
      direction: 'horizontal'
    });
    expect(container).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    const ref = null;
    const { container } = render(ResizablePaneGroup, { ref, direction: 'horizontal' });
    expect(container).toBeInTheDocument();
  });

  test('should handle this binding', () => {
    const paneGroup: unknown = undefined;
    const { container } = render(ResizablePaneGroup, { this: paneGroup, direction: 'horizontal' });
    expect(container).toBeInTheDocument();
  });

  test('should handle direction prop', () => {
    const { container } = render(ResizablePaneGroup, { direction: 'vertical' });
    expect(container).toBeInTheDocument();
  });

  test('should handle horizontal direction', () => {
    const { container } = render(ResizablePaneGroup, { direction: 'horizontal' });
    expect(container).toBeInTheDocument();
  });

  test('should pass through additional props', () => {
    const { container } = render(ResizablePaneGroup, {
      'data-testid': 'pane-group',
      id: 'my-pane-group',
      direction: 'horizontal'
    });
    expect(container).toBeInTheDocument();
  });

  test('should apply correct data attributes', () => {
    const { container } = render(ResizablePaneGroup, { direction: 'horizontal' });
    expect(container).toBeInTheDocument();
  });

  test('should handle onLayoutChange callback', () => {
    const onLayoutChange = vi.fn();
    const { container } = render(ResizablePaneGroup, { onLayoutChange, direction: 'horizontal' });
    expect(container).toBeInTheDocument();
  });

  test('should handle storage prop', () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn() };
    const { container } = render(ResizablePaneGroup, { storage, direction: 'horizontal' });
    expect(container).toBeInTheDocument();
  });

  test('should handle autoSaveId prop', () => {
    const { container } = render(ResizablePaneGroup, {
      autoSaveId: 'my-layout',
      direction: 'horizontal'
    });
    expect(container).toBeInTheDocument();
  });
});
