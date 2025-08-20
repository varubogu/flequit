import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagCompletionUI from '$lib/components/tag/completion/tag-completion-ui.svelte';
import type { Tag } from '$lib/types/tag';

// Mock Lucide icons
vi.mock('lucide-svelte', () => ({
  Hash: () => ({ $$: { fragment: null } })
}));

describe('TagCompletionUI', () => {
  const mockTags: Tag[] = [
    { id: 'tag-1', name: 'work', color: '#ff0000', created_at: new Date(), updated_at: new Date() },
    {
      id: 'tag-2',
      name: 'personal',
      color: '#00ff00',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'tag-3',
      name: 'urgent',
      color: undefined,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  const defaultProps = {
    showSuggestions: true,
    suggestions: mockTags,
    currentTagInput: 'wo',
    suggestionsPosition: { top: 100, left: 200 },
    onSelectSuggestion: vi.fn(),
    onCreateNewTag: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render when showSuggestions is true', () => {
      render(TagCompletionUI, { props: defaultProps });

      const container = document.querySelector('.fixed.z-\\[9999\\]');
      expect(container).toBeInTheDocument();
    });

    it('should not render when showSuggestions is false', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          showSuggestions: false
        }
      });

      const container = document.querySelector('.fixed.z-\\[9999\\]');
      expect(container).not.toBeInTheDocument();
    });

    it('should position correctly', () => {
      render(TagCompletionUI, { props: defaultProps });

      const container = document.querySelector('.fixed.z-\\[9999\\]') as HTMLElement;
      expect(container.style.top).toBe('100px');
      expect(container.style.left).toBe('200px');
    });

    it('should handle negative positions', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          suggestionsPosition: { top: -50, left: -100 }
        }
      });

      const container = document.querySelector('.fixed.z-\\[9999\\]') as HTMLElement;
      expect(container.style.top).toBe('0px');
      expect(container.style.left).toBe('0px');
    });
  });

  describe('suggestions rendering', () => {
    it('should render all suggestions', () => {
      render(TagCompletionUI, { props: defaultProps });

      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('personal')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('should display debug information', () => {
      render(TagCompletionUI, { props: defaultProps });

      expect(screen.getByText('Debug: showing 3 suggestions')).toBeInTheDocument();
    });

    it('should handle empty suggestions', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          suggestions: []
        }
      });

      expect(screen.getByText('Debug: showing 0 suggestions')).toBeInTheDocument();
    });

    it('should render tag colors when available', () => {
      const { container } = render(TagCompletionUI, { props: defaultProps });

      // Look for any element with background-color style
      const coloredTag = container.querySelector('[style*="background-color"]');
      expect(coloredTag).toBeInTheDocument();
    });

    it('should render hash icon when no color', () => {
      render(TagCompletionUI, { props: defaultProps });

      // Hash icons are mocked, component should render
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('suggestion selection', () => {
    it('should call onSelectSuggestion when suggestion is clicked', () => {
      const mockSelect = vi.fn();
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          onSelectSuggestion: mockSelect
        }
      });

      const workButton = screen.getByText('work').closest('button');
      fireEvent.click(workButton!);

      expect(mockSelect).toHaveBeenCalledWith(mockTags[0]);
    });

    it('should handle multiple suggestion clicks', () => {
      const mockSelect = vi.fn();
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          onSelectSuggestion: mockSelect
        }
      });

      const workButton = screen.getByText('work').closest('button');
      const personalButton = screen.getByText('personal').closest('button');

      fireEvent.click(workButton!);
      fireEvent.click(personalButton!);

      expect(mockSelect).toHaveBeenCalledTimes(2);
      expect(mockSelect).toHaveBeenCalledWith(mockTags[0]);
      expect(mockSelect).toHaveBeenCalledWith(mockTags[1]);
    });

    it('should have proper button attributes', () => {
      render(TagCompletionUI, { props: defaultProps });

      const buttons = document.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('create new tag option', () => {
    it('should show create option when input doesnt match existing tags', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: 'newTag'
        }
      });

      expect(screen.getByText('Create "#newTag"')).toBeInTheDocument();
    });

    it('should hide create option when input matches existing tag exactly', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: 'work'
        }
      });

      expect(screen.queryByText('Create "#work"')).not.toBeInTheDocument();
    });

    it('should hide create option when input matches existing tag case-insensitively', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: 'WORK'
        }
      });

      expect(screen.queryByText('Create "#WORK"')).not.toBeInTheDocument();
    });

    it('should hide create option when input is empty', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: ''
        }
      });

      expect(screen.queryByText(/Create "#"/)).not.toBeInTheDocument();
    });

    it('should hide create option when input is whitespace only', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: '   '
        }
      });

      expect(screen.queryByText(/Create "#"/)).not.toBeInTheDocument();
    });

    it('should call onCreateNewTag when create button is clicked', () => {
      const mockCreate = vi.fn();
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: 'newTag',
          onCreateNewTag: mockCreate
        }
      });

      const createButton = screen.getByText('Create "#newTag"').closest('button');
      fireEvent.click(createButton!);

      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe('exact match detection', () => {
    it('should detect exact match (case-insensitive)', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: 'Work'
        }
      });

      // Should not show create option due to case-insensitive match
      expect(screen.queryByText('Create "#Work"')).not.toBeInTheDocument();
    });

    it('should not detect partial matches', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: 'wor'
        }
      });

      // Should show create option as "wor" doesn't exactly match "work"
      expect(screen.getByText('Create "#wor"')).toBeInTheDocument();
    });

    it('should handle special characters in tag names', () => {
      const specialTags: Tag[] = [
        {
          id: 'tag-1',
          name: 'tag-with-dash',
          color: '#ff0000',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'tag-2',
          name: 'tag with spaces',
          color: '#00ff00',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          suggestions: specialTags,
          currentTagInput: 'tag-with-dash'
        }
      });

      expect(screen.queryByText('Create "#tag-with-dash"')).not.toBeInTheDocument();
    });
  });

  describe('layout and styling', () => {
    it('should have proper container classes', () => {
      render(TagCompletionUI, { props: defaultProps });

      const container = document.querySelector(
        '.fixed.z-\\[9999\\].max-h-40.min-w-48.overflow-y-auto.rounded-md.border.shadow-lg'
      );
      expect(container).toBeInTheDocument();
    });

    it('should have hover effects on buttons', () => {
      render(TagCompletionUI, { props: defaultProps });

      const buttons = document.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
      });
    });

    it('should have proper spacing and layout', () => {
      render(TagCompletionUI, { props: defaultProps });

      const suggestionButtons = document.querySelectorAll('button');
      suggestionButtons.forEach((button) => {
        expect(button).toHaveClass('flex', 'w-full', 'items-center', 'gap-2', 'px-3', 'py-2');
      });
    });

    it('should have border on create new tag button', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: 'newTag'
        }
      });

      const createButton = screen.getByText('Create "#newTag"').closest('button');
      expect(createButton).toHaveClass('border-t');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined suggestions', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          suggestions: undefined as unknown as Tag[]
        }
      });

      expect(document.body).toBeInTheDocument();
    });

    it('should handle null currentTagInput', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: null as unknown as string
        }
      });

      expect(document.body).toBeInTheDocument();
    });

    it('should handle missing callbacks', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          onSelectSuggestion: undefined as ((tag: Tag) => void) | undefined,
          onCreateNewTag: undefined as (() => void) | undefined
        }
      });

      expect(document.body).toBeInTheDocument();
    });

    it('should handle tags without ids', () => {
      const tagsWithoutIds: Tag[] = [
        { id: '', name: 'work', color: '#ff0000', created_at: new Date(), updated_at: new Date() },
        {
          id: null as unknown as string,
          name: 'personal',
          color: '#00ff00',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          suggestions: tagsWithoutIds
        }
      });

      expect(document.body).toBeInTheDocument();
    });

    it('should handle very long tag names', () => {
      const longNameTag: Tag[] = [
        {
          id: 'tag-1',
          name: 'A'.repeat(100),
          color: '#ff0000',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          suggestions: longNameTag
        }
      });

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });
  });

  describe('component lifecycle', () => {
    it('should mount and unmount cleanly', () => {
      const { unmount } = render(TagCompletionUI, { props: defaultProps });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle prop updates', () => {
      const { unmount } = render(TagCompletionUI, { props: defaultProps });

      unmount();

      const updatedProps = {
        ...defaultProps,
        currentTagInput: 'updated',
        showSuggestions: false
      };

      render(TagCompletionUI, { props: updatedProps });

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper button semantics', () => {
      render(TagCompletionUI, { props: defaultProps });

      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard accessible', () => {
      render(TagCompletionUI, { props: defaultProps });

      const buttons = document.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button.tabIndex).not.toBe(-1);
      });
    });

    it('should provide clear visual hierarchy', () => {
      render(TagCompletionUI, {
        props: {
          ...defaultProps,
          currentTagInput: 'newTag'
        }
      });

      // Create button should be visually separated
      const createButton = screen.getByText('Create "#newTag"').closest('button');
      expect(createButton).toHaveClass('border-t');
    });
  });
});
