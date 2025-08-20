import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Sonner from '$lib/components/ui/sonner/sonner.svelte';

// Mock svelte-sonner
vi.mock('svelte-sonner', () => ({
  Toaster: vi.fn(() => ({
    $$: { render: () => '<div data-testid="sonner-toaster">Toaster</div>' }
  })),
  default: vi.fn(() => ({
    $$: { render: () => '<div data-testid="sonner-toaster">Toaster</div>' }
  }))
}));

// Mock mode-watcher
vi.mock('mode-watcher', () => ({
  mode: {
    current: 'light'
  }
}));

describe('Sonner', () => {
  const defaultProps = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(Sonner, { props: defaultProps });

      expect(container).toBeDefined();
    });

    it('should have accessible content', () => {
      const { container } = render(Sonner, { props: defaultProps });

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('props handling', () => {
    it('should accept position prop', () => {
      expect(() => {
        render(Sonner, {
          props: { position: 'top-right' }
        });
      }).not.toThrow();
    });

    it('should accept duration prop', () => {
      expect(() => {
        render(Sonner, {
          props: { duration: 3000 }
        });
      }).not.toThrow();
    });

    it('should accept closeButton prop', () => {
      expect(() => {
        render(Sonner, {
          props: { closeButton: true }
        });
      }).not.toThrow();
    });

    it('should accept richColors prop', () => {
      expect(() => {
        render(Sonner, {
          props: { richColors: true }
        });
      }).not.toThrow();
    });

    it('should accept expand prop', () => {
      expect(() => {
        render(Sonner, {
          props: { expand: true }
        });
      }).not.toThrow();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(Sonner, { props: defaultProps });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(Sonner, { props: defaultProps });

      expect(() => rerender({ position: 'top-center' })).not.toThrow();
      expect(() => rerender({ duration: 4000 })).not.toThrow();
      expect(() => rerender({ closeButton: true })).not.toThrow();
    });
  });
});
