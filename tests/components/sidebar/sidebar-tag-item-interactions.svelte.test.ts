import { afterAll, afterEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { getTranslationService, setTranslationService } from '$lib/stores/locale.svelte';
import { tagStore } from '$lib/stores/tags.svelte';
import { TagService } from '$lib/services/domain/tag';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import SidebarTagItem from '$lib/components/sidebar/sidebar-tag-item.svelte';
import type { Tag } from '$lib/types/tag';

const sidebar = vi.hoisted(() => ({
  state: 'expanded' as 'expanded' | 'collapsed',
  open: true,
  isMobile: false,
  toggleSidebar: vi.fn(),
  setOpen: vi.fn()
}));

vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => sidebar
}));

vi.mock('$lib/stores/tasks.svelte', () => ({
  taskStore: {
    getTaskCountByTag: vi.fn(() => 5)
  }
}));

const originalTranslationService = getTranslationService();

const mockTag: Tag = {
  id: 'tag-1',
  name: 'Work',
  color: '#ff0000',
  createdAt: new Date(),
  updatedAt: new Date(),
  deleted: false,
  updatedBy: 'test-user-id'
};

afterAll(() => {
  setTranslationService(originalTranslationService);
});

afterEach(() => {
  sidebar.state = 'expanded';
  tagStore.setTags([]);
  tagStore.removeBookmark(mockTag.id);
  vi.restoreAllMocks();
});

function renderItem(
  tag: Tag = mockTag,
  handlers: {
    onDragEnter?: (event: DragEvent, element: HTMLElement) => void;
    onDragLeave?: (event: DragEvent, element: HTMLElement) => void;
  } = {}
) {
  return render(SidebarTagItem, { props: { tag, ...handlers } });
}

describe('SidebarTagItem interactions', () => {
  test('shows only the hash icon when the sidebar is collapsed', () => {
    setTranslationService(createUnitTestTranslationService());
    sidebar.state = 'collapsed';
    renderItem();

    const button = screen.getByTestId('tag-tag-1');
    expect(button.className).toContain('justify-center');
    expect(screen.queryByText('Work')).not.toBeInTheDocument();
    expect(button.querySelector('svg')?.getAttribute('style')).toContain('255, 0, 0');

    sidebar.state = 'collapsed';
    renderItem({ ...mockTag, id: 'tag-plain', color: undefined });
    expect(screen.getByTestId('tag-tag-plain').querySelector('svg')?.getAttribute('style')).toContain(
      'currentcolor'
    );
  });

  test('forwards drag enter and leave only when a handler is provided', async () => {
    setTranslationService(createUnitTestTranslationService());
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    renderItem(mockTag, { onDragEnter, onDragLeave });
    const button = screen.getByTestId('tag-tag-1');

    await fireEvent.dragEnter(button);
    await fireEvent.dragLeave(button);

    expect(onDragEnter).toHaveBeenCalledOnce();
    expect(onDragEnter.mock.calls[0][1]).toBe(button);
    expect(onDragLeave).toHaveBeenCalledOnce();
    expect(onDragLeave.mock.calls[0][1]).toBe(button);
  });

  test('ignores drag enter and leave when no handler is provided', async () => {
    setTranslationService(createUnitTestTranslationService());
    renderItem();
    const button = screen.getByTestId('tag-tag-1');
    await fireEvent.dragEnter(button);
    await fireEvent.dragLeave(button);
    expect(button).toBeInTheDocument();
  });

  test('adds the tag to the sidebar when a project can be resolved', async () => {
    setTranslationService(createUnitTestTranslationService());
    vi.spyOn(tagStore, 'getProjectIdByTagId').mockResolvedValue('project-1');
    const addBookmark = vi.mocked(TagService.addBookmark);
    renderItem();

    await fireEvent.contextMenu(screen.getByTestId('tag-tag-1'));
    await fireEvent.click(await screen.findByText('TEST_ADD_TAG_TO_SIDEBAR'));

    expect(addBookmark).toHaveBeenCalledWith('project-1', 'tag-1');
  });

  test('reports a missing project and does not bookmark the tag', async () => {
    setTranslationService(createUnitTestTranslationService());
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(tagStore, 'getProjectIdByTagId').mockResolvedValue(null);
    const addBookmark = vi.mocked(TagService.addBookmark);
    renderItem();

    await fireEvent.contextMenu(screen.getByTestId('tag-tag-1'));
    await fireEvent.click(await screen.findByText('TEST_ADD_TAG_TO_SIDEBAR'));

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith('Project ID not found for tag:', 'tag-1');
    });
    expect(addBookmark).not.toHaveBeenCalled();
  });
});
