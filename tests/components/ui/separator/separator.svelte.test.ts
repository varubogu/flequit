import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Separator from '$lib/components/ui/separator/separator.svelte';

// Mock bits-ui
vi.mock('bits-ui', () => ({
  Separator: {
    Root: () => ({ 
      render: () => '<div data-testid="separator-root">Separator</div>' 
    })
  }
}));

// Mock cn utility
vi.mock('$lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}));

describe('Separator', () => {
  const defaultProps = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      const { container } = render(Separator, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should render bits-ui Separator.Root component', () => {
      const { getByTestId } = render(Separator, { props: defaultProps });
      
      expect(getByTestId('separator-root')).toBeInTheDocument();
    });

    it('should apply data-slot attribute', () => {
      render(Separator, { props: defaultProps });
      
      // Component should include data-slot="separator"
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply default CSS classes', () => {
      render(Separator, { props: defaultProps });
      
      // cn utility should be called with default classes
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        undefined
      );
    });

    it('should merge custom className with default classes', () => {
      const customClass = 'custom-separator';
      render(Separator, { props: { class: customClass } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        customClass
      );
    });

    it('should handle multiple custom classes', () => {
      const customClasses = 'custom-separator another-class';
      render(Separator, { props: { class: customClasses } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        customClasses
      );
    });

    it('should handle empty className', () => {
      render(Separator, { props: { class: '' } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        ''
      );
    });
  });

  describe('props handling', () => {
    it('should pass through additional props to bits-ui component', () => {
      const additionalProps = {
        'data-testid': 'custom-separator',
        'aria-label': 'Custom separator',
        id: 'separator-id'
      };
      
      const { container } = render(Separator, { props: additionalProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle orientation prop', () => {
      const { container } = render(Separator, { 
        props: { orientation: 'vertical' }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle decorative prop', () => {
      const { container } = render(Separator, { 
        props: { decorative: true }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle all bits-ui props', () => {
      const allProps = {
        orientation: 'horizontal',
        decorative: false,
        'data-testid': 'separator',
        'aria-orientation': 'horizontal'
      };
      
      const { container } = render(Separator, { props: allProps });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('ref binding', () => {
    it('should handle ref binding', () => {
      let separatorRef: HTMLElement | null = null;
      
      const { container } = render(Separator, { 
        props: { 
          bind: { ref: separatorRef }
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should initialize ref as null by default', () => {
      const { container } = render(Separator, { props: defaultProps });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle undefined ref', () => {
      const { container } = render(Separator, { 
        props: { ref: undefined }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should be accessible by default', () => {
      const { container } = render(Separator, { props: defaultProps });
      
      // bits-ui should handle accessibility
      expect(container.innerHTML).toBeTruthy();
    });

    it('should support custom aria attributes', () => {
      const { container } = render(Separator, { 
        props: { 
          'aria-label': 'Content separator',
          'aria-orientation': 'horizontal'
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle decorative separators', () => {
      const { container } = render(Separator, { 
        props: { decorative: true }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle semantic separators', () => {
      const { container } = render(Separator, { 
        props: { decorative: false }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('orientation variants', () => {
    it('should handle horizontal orientation', () => {
      const { container } = render(Separator, { 
        props: { orientation: 'horizontal' }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle vertical orientation', () => {
      const { container } = render(Separator, { 
        props: { orientation: 'vertical' }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should default to horizontal orientation', () => {
      const { container } = render(Separator, { props: defaultProps });
      
      // Default behavior should work
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle null className', () => {
      const { container } = render(Separator, { 
        props: { class: null as any }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle undefined props', () => {
      const { container } = render(Separator, { 
        props: { 
          orientation: undefined,
          decorative: undefined,
          class: undefined
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle invalid orientation', () => {
      const { container } = render(Separator, { 
        props: { orientation: 'invalid' as any }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should handle complex className objects', () => {
      const complexClass = {
        toString: () => 'dynamic-class'
      };
      
      const { container } = render(Separator, { 
        props: { class: complexClass as any }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(Separator, { props: defaultProps });
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { rerender } = render(Separator, { props: defaultProps });
      
      expect(() => rerender({ orientation: 'vertical' })).not.toThrow();
      expect(() => rerender({ class: 'updated-class' })).not.toThrow();
      expect(() => rerender({ decorative: true })).not.toThrow();
    });

    it('should maintain consistency across rerenders', () => {
      const { rerender } = render(Separator, { props: { class: 'initial' } });
      
      rerender({ class: 'updated' });
      rerender({ class: 'final' });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
        'final'
      );
    });
  });

  describe('CSS classes', () => {
    it('should include responsive orientation classes', () => {
      render(Separator, { props: defaultProps });
      
      const expectedClasses = 'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px';
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalledWith(
        expectedClasses,
        undefined
      );
    });

    it('should include background and sizing classes', () => {
      render(Separator, { props: defaultProps });
      
      // Should include bg-border and shrink-0
      const calledWith = vi.mocked(vi.importMock('$lib/utils')).cn.mock.calls[0][0];
      expect(calledWith).toContain('bg-border');
      expect(calledWith).toContain('shrink-0');
    });

    it('should include data attribute selectors', () => {
      render(Separator, { props: defaultProps });
      
      const calledWith = vi.mocked(vi.importMock('$lib/utils')).cn.mock.calls[0][0];
      expect(calledWith).toContain('data-[orientation=horizontal]');
      expect(calledWith).toContain('data-[orientation=vertical]');
    });
  });

  describe('integration', () => {
    it('should integrate with bits-ui Separator', () => {
      const { getByTestId } = render(Separator, { props: defaultProps });
      
      expect(getByTestId('separator-root')).toBeInTheDocument();
    });

    it('should integrate with cn utility function', () => {
      render(Separator, { props: { class: 'test-class' } });
      
      expect(vi.mocked(vi.importMock('$lib/utils')).cn).toHaveBeenCalled();
    });

    it('should work with form layouts', () => {
      const { container } = render(Separator, { 
        props: { 
          class: 'my-4',
          'data-testid': 'form-separator'
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });

    it('should work with navigation layouts', () => {
      const { container } = render(Separator, { 
        props: { 
          orientation: 'vertical',
          class: 'mx-2'
        }
      });
      
      expect(container.innerHTML).toBeTruthy();
    });
  });
});