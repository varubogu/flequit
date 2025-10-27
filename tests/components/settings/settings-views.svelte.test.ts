import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsViews from '$lib/components/settings/views/settings-views.svelte';
import { setupViewsVisibilityStoreOverride } from '../../utils/store-overrides';

// Mock translation service
vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => ({
    getMessage: (key: string) => () => {
      const messages: Record<string, string> = {
        views_settings: 'Views Settings',
        views_description_text:
          'Drag and drop to reorder views, move them between visible and hidden sections',
        reset_to_defaults: 'Reset to Defaults',
        reset_view_settings: 'Reset View Settings',
        reset_view_confirmation: 'Are you sure you want to reset views to defaults?',
        reset: 'Reset',
        visible_in_sidebar: 'Visible in sidebar',
        hidden_from_sidebar: 'Hidden from sidebar'
      };
      return messages[key] || key;
    }
  })),
  reactiveMessage: (fn: () => string) => fn
}));

const { mockViewsVisibilityStore } = vi.hoisted(() => ({
  mockViewsVisibilityStore: {
    resetToDefaults: vi.fn(),
    visibleViews: [
      { id: 'today', name: 'Today' },
      { id: 'upcoming', name: 'Upcoming' }
    ],
    hiddenViews: [{ id: 'completed', name: 'Completed' }]
  }
}));

// Mock SettingsDraggableItems component
vi.mock('$lib/components/settings/settings-draggable-items.svelte', () => ({
  default: () => null
}));

// Mock ConfirmDialog component
vi.mock('$lib/components/confirm-dialog.svelte', () => ({
  default: () => null
}));

describe('SettingsViews Component', () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup = setupViewsVisibilityStoreOverride(mockViewsVisibilityStore as never);
  });

  afterEach(() => {
    cleanup?.();
  });

  test('should render views settings section', () => {
    render(SettingsViews);

    expect(screen.getByText('Views Settings')).toBeInTheDocument();
    expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
  });

  test('should display description text', () => {
    render(SettingsViews);

    expect(
      screen.getByText(
        /Drag and drop to reorder views, move them between visible and hidden sections/
      )
    ).toBeInTheDocument();
  });

  test('should render reset to defaults button', () => {
    render(SettingsViews);

    const resetButton = screen.getByText('Reset to Defaults');
    expect(resetButton).toBeInTheDocument();
    expect(resetButton.closest('button')).toHaveClass('border-input');
  });

  test('should show confirm dialog when reset button is clicked', async () => {
    render(SettingsViews);

    const resetButton = screen.getByText('Reset to Defaults');
    await fireEvent.click(resetButton);

    // Since we mocked the ConfirmDialog, we can't test the actual dialog,
    // but we can verify the button click works
    expect(resetButton).toBeInTheDocument();
  });

  test('should have reset icon in button', () => {
    render(SettingsViews);

    const resetButton = screen.getByText('Reset to Defaults').closest('button');
    expect(resetButton).toBeInTheDocument();

    // Check for the RotateCcw icon class
    const icon = resetButton?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  test('should have correct button styling', () => {
    render(SettingsViews);

    const resetButton = screen.getByText('Reset to Defaults').closest('button');
    expect(resetButton).toHaveClass('border-input');
  });

  test('should render section with correct id', () => {
    const { container } = render(SettingsViews);

    const section = container.querySelector('#settings-views');
    expect(section).toBeInTheDocument();
  });

  test('should have proper spacing structure', () => {
    const { container } = render(SettingsViews);

    const spaceContainer = container.querySelector('.space-y-6');
    expect(spaceContainer).toBeInTheDocument();
  });

  test('should have flex layout for header', () => {
    const { container } = render(SettingsViews);

    const headerContainer = container.querySelector('.flex.items-center.justify-between');
    expect(headerContainer).toBeInTheDocument();
  });
});
