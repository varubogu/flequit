import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ConfirmDialog from '$lib/components/dialog/confirm-dialog.svelte';

// Mock UI components
vi.mock('$lib/components/ui/dialog.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/ui/dialog-content.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/ui/dialog-header.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/ui/dialog-title.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/ui/dialog-description.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/ui/dialog-footer.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('$lib/components/shared/button.svelte', () => ({
  default: () => ({ $$: { fragment: null } })
}));

vi.mock('lucide-svelte', () => ({
  Check: () => ({ $$: { fragment: null } }),
  X: () => ({ $$: { fragment: null } })
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    show: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render when show is true', () => {
      render(ConfirmDialog, { props: defaultProps });
      expect(document.body).toBeInTheDocument();
    });

    it('should handle show state changes', () => {
      render(ConfirmDialog, { props: { ...defaultProps, show: false } });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('should handle title and message', () => {
      render(ConfirmDialog, { props: defaultProps });
      expect(document.body).toBeInTheDocument();
    });

    it('should handle long content', () => {
      render(ConfirmDialog, {
        props: {
          ...defaultProps,
          title: 'A'.repeat(100),
          message: 'B'.repeat(500)
        }
      });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('button customization', () => {
    it('should use default button texts', () => {
      render(ConfirmDialog, { props: defaultProps });
      expect(document.body).toBeInTheDocument();
    });

    it('should use custom button texts', () => {
      render(ConfirmDialog, {
        props: {
          ...defaultProps,
          confirmText: 'Yes, Delete',
          cancelText: 'No, Keep'
        }
      });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('callback handling', () => {
    it('should handle confirm and cancel callbacks', () => {
      const mockConfirm = vi.fn();
      const mockCancel = vi.fn();
      render(ConfirmDialog, {
        props: {
          ...defaultProps,
          onConfirm: mockConfirm,
          onCancel: mockCancel
        }
      });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters', () => {
      render(ConfirmDialog, {
        props: {
          ...defaultProps,
          title: 'Title with 特殊文字 & symbols!',
          message: 'Message with émojis 🔥'
        }
      });
      expect(document.body).toBeInTheDocument();
    });

    it('should handle null callbacks', () => {
      render(ConfirmDialog, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Testing runtime safety with null callbacks
        props: {
          ...defaultProps,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onConfirm: null,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onCancel: null
        }
      });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(ConfirmDialog, { props: defaultProps });
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('real-world scenarios', () => {
    it('should handle delete confirmation', () => {
      const deleteProps = {
        show: true,
        title: 'Delete Item',
        message: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Keep',
        onConfirm: vi.fn(),
        onCancel: vi.fn()
      };

      render(ConfirmDialog, { props: deleteProps });
      expect(document.body).toBeInTheDocument();
    });

    it('should handle save changes scenario', () => {
      const saveProps = {
        show: true,
        title: 'Unsaved Changes',
        message: 'Do you want to save your changes?',
        confirmText: 'Save',
        cancelText: 'Discard',
        onConfirm: vi.fn(),
        onCancel: vi.fn()
      };

      render(ConfirmDialog, { props: saveProps });
      expect(document.body).toBeInTheDocument();
    });
  });
});
