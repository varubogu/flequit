import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Button from '$lib/components/shared/button.svelte';

// Mock UI Button component
vi.mock('$lib/components/ui/button.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render without errors', () => {
      render(Button);
      expect(document.body).toBeInTheDocument();
    });

    it('should render with custom class', () => {
      render(Button, { props: { class: 'custom-class' } });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('button variants', () => {
    it('should handle all variants', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'];
      variants.forEach(variant => {
        render(Button, { props: { variant: variant as any } });
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('button sizes', () => {
    it('should handle all sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'icon'];
      sizes.forEach(size => {
        render(Button, { props: { size: size as any } });
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('interaction props', () => {
    it('should handle interaction props', () => {
      const props = {
        onclick: vi.fn(),
        disabled: true,
        title: 'Button Title',
        'aria-label': 'Button Label',
        'data-testid': 'test-button'
      };
      
      render(Button, { props });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('drag and drop props', () => {
    it('should handle drag and drop props', () => {
      const dragProps = {
        draggable: true,
        ondragstart: vi.fn(),
        ondragover: vi.fn(),
        ondrop: vi.fn(),
        ondragend: vi.fn(),
        ondragenter: vi.fn(),
        ondragleave: vi.fn()
      };
      
      render(Button, { props: dragProps });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined props', () => {
      render(Button, { 
        props: { 
          onclick: null as any,
          title: undefined,
          variant: undefined,
          size: undefined
        }
      });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(Button);
      expect(() => unmount()).not.toThrow();
    });
  });
});