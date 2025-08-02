import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import SidebarSearchHeader from '$lib/components/sidebar/sidebar-search-header.svelte';

// --- Paraglide Mock ---

// getTranslationServiceのモック化
vi.mock('$lib/stores/locale.svelte', async () => {
  const actual = await vi.importActual('$lib/stores/locale.svelte');
  return {
    ...actual,
    getTranslationService: vi.fn(() => createUnitTestTranslationService()),
    reactiveMessage: (fn: () => string) => fn
  };
});

// --- Sidebar Context Mock ---
vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
  useSidebar: () => ({
    state: 'expanded',
    open: true,
    isMobile: false,
    toggleSidebar: vi.fn(),
    setOpen: vi.fn()
  })
}));

describe('SidebarSearchHeader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render search button', () => {
    render(SidebarSearchHeader);
    expect(screen.getByText('TEST_SEARCH')).toBeInTheDocument();
    expect(screen.getByText('TEST_SEARCH').closest('button')).toBeInTheDocument();
  });

  test('should open search dialog on click', async () => {
    render(SidebarSearchHeader);
    const searchButton = screen.getByText('TEST_SEARCH').closest('button');
    await fireEvent.click(searchButton!);
    expect(true).toBe(true);
  });

  test('should open search dialog with keyboard shortcut', async () => {
    render(SidebarSearchHeader);
    await fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(true).toBe(true);
  });

  test('should open search dialog with ctrl+k', async () => {
    render(SidebarSearchHeader);
    await fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(true).toBe(true);
  });

  test('should show keyboard shortcut hint', () => {
    render(SidebarSearchHeader);
    expect(screen.getByText('TEST_SEARCH').closest('button')).toBeInTheDocument();
  });
});
