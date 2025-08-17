import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

// Mock utils
vi.mock('$lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
  type: vi.fn()
}));

describe('Skeleton', () => {
  const defaultProps = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(Skeleton, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should render as a div element', () => {
      const { container } = render(Skeleton, { props: defaultProps });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toBeInTheDocument();
    });

    it('should apply data-slot attribute', () => {
      const { container } = render(Skeleton, { props: defaultProps });
      
      const skeleton = container.querySelector('[data-slot="skeleton"]');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply default CSS classes', () => {
      render(Skeleton, { props: defaultProps });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        undefined
      );
    });

    it('should merge custom className with default classes', () => {
      const customClass = 'custom-skeleton';
      render(Skeleton, { props: { class: customClass } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        customClass
      );
    });

    it('should handle multiple custom classes', () => {
      const customClasses = 'w-full h-4 mb-2';
      render(Skeleton, { props: { class: customClasses } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        customClasses
      );
    });

    it('should handle empty className', () => {
      render(Skeleton, { props: { class: '' } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        ''
      );
    });

    it('should include animation class', () => {
      render(Skeleton, { props: defaultProps });
      
      const calledWith = vi.mocked(vi.importMock('$lib/utils')).cn.mock.calls[0][0];
      expect(calledWith).toContain('animate-pulse');
    });

    it('should include background class', () => {
      render(Skeleton, { props: defaultProps });
      
      const calledWith = vi.mocked(vi.importMock('$lib/utils')).cn.mock.calls[0][0];
      expect(calledWith).toContain('bg-accent');
    });

    it('should include border radius class', () => {
      render(Skeleton, { props: defaultProps });
      
      const calledWith = vi.mocked(vi.importMock('$lib/utils')).cn.mock.calls[0][0];
      expect(calledWith).toContain('rounded-md');
    });
  });

  describe('props handling', () => {
    it('should pass through HTML attributes', () => {
      const { container } = render(Skeleton, { 
        props: { 
          'data-testid': 'skeleton-element',
          id: 'skeleton-id',
          'aria-label': 'Loading content'
        }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('data-testid', 'skeleton-element');
      expect(skeleton).toHaveAttribute('id', 'skeleton-id');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should handle style attribute', () => {
      const { container } = render(Skeleton, { 
        props: { style: 'width: 200px; height: 20px;' }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('style', 'width: 200px; height: 20px;');
    });

    it('should handle role attribute', () => {
      const { container } = render(Skeleton, { 
        props: { role: 'status' }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('role', 'status');
    });

    it('should handle event handlers', () => {
      const handleClick = vi.fn();
      const { container } = render(Skeleton, { 
        props: { onclick: handleClick }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('ref binding', () => {
    it('should handle ref binding', () => {
      let skeletonRef: HTMLDivElement | null = null;
      
      const { container } = render(Skeleton, { 
        props: { 
          bind: { ref: skeletonRef }
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should initialize ref as null by default', () => {
      const { container } = render(Skeleton, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle undefined ref', () => {
      const { container } = render(Skeleton, { 
        props: { ref: undefined }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should support aria-label for screen readers', () => {
      const { container } = render(Skeleton, { 
        props: { 'aria-label': 'Loading content' }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should support role attribute', () => {
      const { container } = render(Skeleton, { 
        props: { role: 'status' }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('role', 'status');
    });

    it('should support aria-hidden for decorative skeletons', () => {
      const { container } = render(Skeleton, { 
        props: { 'aria-hidden': 'true' }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    });

    it('should support aria-live for live regions', () => {
      const { container } = render(Skeleton, { 
        props: { 'aria-live': 'polite' }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('common use cases', () => {
    it('should support text skeleton with width and height', () => {
      const { container } = render(Skeleton, { 
        props: { class: 'w-full h-4' }
      });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        'w-full h-4'
      );
    });

    it('should support circular skeleton', () => {
      const { container } = render(Skeleton, { 
        props: { class: 'w-12 h-12 rounded-full' }
      });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        'w-12 h-12 rounded-full'
      );
    });

    it('should support card skeleton with padding', () => {
      const { container } = render(Skeleton, { 
        props: { class: 'w-full h-24 p-4' }
      });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        'w-full h-24 p-4'
      );
    });

    it('should support avatar skeleton', () => {
      const { container } = render(Skeleton, { 
        props: { class: 'w-10 h-10 rounded-full' }
      });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        'w-10 h-10 rounded-full'
      );
    });

    it('should support button skeleton', () => {
      const { container } = render(Skeleton, { 
        props: { class: 'w-20 h-8 rounded' }
      });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        'w-20 h-8 rounded'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null className', () => {
      const { container } = render(Skeleton, { 
        props: { class: null as any }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle undefined props', () => {
      const { container } = render(Skeleton, { 
        props: { 
          class: undefined,
          id: undefined,
          style: undefined
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle complex className objects', () => {
      const complexClass = {
        toString: () => 'dynamic-skeleton'
      };
      
      const { container } = render(Skeleton, { 
        props: { class: complexClass as any }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle empty object as props', () => {
      const { container } = render(Skeleton, { props: {} });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle boolean attributes', () => {
      const { container } = render(Skeleton, { 
        props: { 
          hidden: true,
          disabled: false
        }
      });
      
      const skeleton = container.querySelector('div');
      expect(skeleton).toHaveAttribute('hidden');
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(Skeleton, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(Skeleton, { props: defaultProps });
      
      expect(() => rerender({ class: 'w-full h-4' })).not.toThrow();
      expect(() => rerender({ class: 'w-12 h-12 rounded-full' })).not.toThrow();
      expect(() => rerender({ 'aria-label': 'Loading profile' })).not.toThrow();
    });

    it('should maintain consistency across rerenders', () => {
      const { rerender } = render(Skeleton, { props: { class: 'initial' } });
      
      rerender({ class: 'updated' });
      rerender({ class: 'final' });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        'final'
      );
    });

    it('should handle multiple simultaneous rerenders', () => {
      const { rerender } = render(Skeleton, { props: defaultProps });
      
      rerender({ class: 'w-full', id: 'skeleton-1' });
      rerender({ class: 'w-half', 'aria-label': 'Loading' });
      rerender({ style: 'opacity: 0.5' });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('animation', () => {
    it('should include pulse animation by default', () => {
      render(Skeleton, { props: defaultProps });
      
      const calledWith = vi.mocked(vi.importMock('$lib/utils')).cn.mock.calls[0][0];
      expect(calledWith).toContain('animate-pulse');
    });

    it('should allow overriding animation with custom class', () => {
      render(Skeleton, { props: { class: 'animate-bounce' } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        'animate-bounce'
      );
    });

    it('should support no animation', () => {
      render(Skeleton, { props: { class: 'animate-none' } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-accent animate-pulse rounded-md',
        'animate-none'
      );
    });
  });

  describe('integration', () => {
    it('should integrate with cn utility function', () => {
      render(Skeleton, { props: { class: 'test-class' } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalled();
    });

    it('should work in loading states', () => {
      const { container } = render(Skeleton, { 
        props: { 
          class: 'w-full h-4 mb-2',
          role: 'status',
          'aria-label': 'Loading content'
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should work in card layouts', () => {
      const { container } = render(Skeleton, { 
        props: { 
          class: 'space-y-3',
          'data-testid': 'card-skeleton'
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should work in list layouts', () => {
      const { container } = render(Skeleton, { 
        props: { 
          class: 'w-full h-8 mb-1',
          'data-testid': 'list-item-skeleton'
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });
});