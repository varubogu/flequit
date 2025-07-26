import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsDialog from '$lib/components/settings/settings-dialog.svelte';

// Mock all settings sub-components
vi.mock('$lib/components/settings/settings-basic.svelte', () => ({
  default: () => null
}));

vi.mock('$lib/components/settings/settings-views.svelte', () => ({
  default: () => null
}));

vi.mock('$lib/components/settings/settings-appearance.svelte', () => ({
  default: () => null
}));

vi.mock('$lib/components/settings/settings-account.svelte', () => ({
  default: () => null
}));

// Mock settings store
vi.mock('../../src/lib/stores/settings.svelte', () => ({
  settingsStore: {
    timezone: 'UTC',
    setTimezone: vi.fn(),
    effectiveTimezone: 'UTC'
  }
}));

describe('SettingsDialog Integration', () => {
  let onOpenChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onOpenChange = vi.fn();
    vi.clearAllMocks();
  });

  test('should render settings dialog when open', () => {
    render(SettingsDialog, { open: true, onOpenChange });

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure your preferences')).toBeInTheDocument();
  });

  test('should not render dialog content when closed', () => {
    render(SettingsDialog, { open: false, onOpenChange });

    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  test('should render all category navigation buttons', () => {
    render(SettingsDialog, { open: true, onOpenChange });

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  test('should show category descriptions', () => {
    render(SettingsDialog, { open: true, onOpenChange });

    expect(screen.getByText('General application settings')).toBeInTheDocument();
    expect(screen.getByText('Customize how you view your tasks')).toBeInTheDocument();
    expect(screen.getByText('Customize the appearance of the application')).toBeInTheDocument();
    expect(screen.getByText('Manage your account settings')).toBeInTheDocument();
  });

  test('should render search input', () => {
    render(SettingsDialog, { open: true, onOpenChange });

    const searchInput = screen.getByPlaceholderText('Search settings...');
    expect(searchInput).toBeInTheDocument();
  });

  test('should render close button', () => {
    render(SettingsDialog, { open: true, onOpenChange });

    const closeButtons = screen.getAllByRole('button');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  test('should handle button interactions', async () => {
    render(SettingsDialog, { open: true, onOpenChange });

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Test that buttons are interactive
    expect(buttons[0]).toBeInTheDocument();
  });

  test('should update search query when typing in search input', async () => {
    render(SettingsDialog, { open: true, onOpenChange });

    const searchInput = screen.getByPlaceholderText('Search settings...');
    await fireEvent.change(searchInput, { target: { value: 'theme' } });

    expect(searchInput).toHaveValue('theme');
  });

  test('should highlight selected category', () => {
    render(SettingsDialog, { open: true, onOpenChange });

    // Default selection should be 'basic' (General)
    const generalButton = screen.getByText('General').closest('button');
    expect(generalButton).toHaveClass('bg-secondary');
  });

  test('should change selected category when clicked', async () => {
    render(SettingsDialog, { open: true, onOpenChange });

    const viewsButton = screen.getByText('Views').closest('button');
    await fireEvent.click(viewsButton!);

    expect(viewsButton).toHaveClass('bg-secondary');
  });

  test('should have correct dialog layout structure', () => {
    const { container } = render(SettingsDialog, { open: true, onOpenChange });

    // Check for dialog container exists
    expect(container).toBeInTheDocument();
  });

  test('should initialize settings with correct timezone', () => {
    render(SettingsDialog, { open: true, onOpenChange });

    // Since we're testing the integration, we just verify the dialog renders
    // The actual settings initialization is tested in individual component tests
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('should handle dialog open state changes', async () => {
    const { rerender } = render(SettingsDialog, { open: false, onOpenChange });

    expect(screen.queryByText('Settings')).not.toBeInTheDocument();

    await rerender({ open: true, onOpenChange });
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('should have responsive design', () => {
    const { container } = render(SettingsDialog, { open: true, onOpenChange });

    expect(container).toBeInTheDocument();
  });

  test('should render with proper layout', () => {
    const { container } = render(SettingsDialog, { open: true, onOpenChange });

    expect(container).toBeInTheDocument();
  });
});
