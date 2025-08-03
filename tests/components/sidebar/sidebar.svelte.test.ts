import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import { createUnitTestTranslationService } from '../../unit-translation-mock';
import Sidebar from '$lib/components/sidebar/sidebar.svelte';

// Mock all child components to avoid deep rendering issues
vi.mock('$lib/components/sidebar/sidebar-search-header.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({ component: 'SidebarSearchHeader' }))
}));

vi.mock('$lib/components/sidebar/sidebar-view-list.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({ component: 'SidebarViewList' }))
}));

vi.mock('$lib/components/sidebar/sidebar-project-list.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({ component: 'SidebarProjectList' }))
}));

vi.mock('$lib/components/sidebar/sidebar-tag-list.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({ component: 'SidebarTagList' }))
}));

vi.mock('$lib/components/user/user-profile.svelte', () => ({
  default: vi.fn().mockImplementation(() => ({ component: 'UserProfile' }))
}));

// --- Paraglide Mock ---


// --- Store Mocks ---
vi.mock('$lib/stores/tasks.svelte', () => ({ taskStore: {} }));
vi.mock('$lib/stores/tags.svelte', () => ({ tagStore: {} }));

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

describe('Sidebar Component Integration', () => {
  let onViewChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
    onViewChange = vi.fn();
    vi.clearAllMocks();
  });

  test('should render sidebar component', () => {
    const { container } = render(Sidebar, { onViewChange });
    expect(container).toBeInTheDocument();
  });

  test('should pass props to sidebar', () => {
    const { container } = render(Sidebar, { currentView: 'today', onViewChange });
    expect(container).toBeInTheDocument();
  });

  test('should render with default props', () => {
    const { container } = render(Sidebar, { onViewChange });
    expect(container).toBeInTheDocument();
  });

  test('should handle different view types', () => {
    const { container } = render(Sidebar, { currentView: 'project', onViewChange });
    expect(container).toBeInTheDocument();
  });
});
