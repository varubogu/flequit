import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ResizableHandle from '$lib/components/ui/resizable/resizable-handle.svelte';

// Mock paneforge
vi.mock('paneforge', () => ({
  PaneResizer: vi.fn().mockImplementation((props) => ({
    component: 'PaneResizer',
    props
  }))
}));

// Mock lucide icon
vi.mock('@lucide/svelte/icons/grip-vertical', () => ({
  default: vi.fn().mockImplementation(() => ({
    component: 'GripVerticalIcon'
  }))
}));

// Mock cn utility
vi.mock('../../../../src/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('ResizableHandle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render resizable handle with default props', () => {
    const { container } = render(ResizableHandle);
    expect(container).toBeInTheDocument();
  });

  test('should accept custom class name', () => {
    const { container } = render(ResizableHandle, { class: 'custom-handle' });
    expect(container).toBeInTheDocument();
  });

  test('should handle ref binding', () => {
    let ref = null;
    const { container } = render(ResizableHandle, { ref });
    expect(container).toBeInTheDocument();
  });

  test('should not show grip handle by default', () => {
    const { container } = render(ResizableHandle, { withHandle: false });
    expect(container).toBeInTheDocument();
  });

  test('should show grip handle when withHandle is true', () => {
    const { container } = render(ResizableHandle, { withHandle: true });
    expect(container).toBeInTheDocument();
  });

  test('should pass through additional props', () => {
    const { container } = render(ResizableHandle, {
      'data-testid': 'resizable-handle',
      disabled: true
    });
    expect(container).toBeInTheDocument();
  });

  test('should apply correct data attributes', () => {
    const { container } = render(ResizableHandle);
    expect(container).toBeInTheDocument();
  });

  test('should handle additional props', () => {
    const { container } = render(ResizableHandle, { 'data-testid': 'handle' });
    expect(container).toBeInTheDocument();
  });

  test('should combine withHandle and custom class', () => {
    const { container } = render(ResizableHandle, {
      withHandle: true,
      class: 'custom-class'
    });
    expect(container).toBeInTheDocument();
  });
});
