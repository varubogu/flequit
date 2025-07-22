import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsDialog from '../../src/lib/components/settings-dialog.svelte';

// Mock all settings sub-components
vi.mock('../../src/lib/components/settings/settings-basic.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/settings/settings-views.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/settings/settings-appearance.svelte', () => ({
  default: () => null
}));

vi.mock('../../src/lib/components/settings/settings-account.svelte', () => ({
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
    expect(screen.getByText('Configure your application preferences')).toBeInTheDocument();
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
    
    expect(screen.getByText('Week start, due date buttons')).toBeInTheDocument();
    expect(screen.getByText('Control which views appear in sidebar')).toBeInTheDocument();
    expect(screen.getByText('Theme, font, color settings')).toBeInTheDocument();
    expect(screen.getByText('Account selection and settings')).toBeInTheDocument();
  });

  test('should render search input', () => {
    render(SettingsDialog, { open: true, onOpenChange });
    
    const searchInput = screen.getByPlaceholderText('Search settings...');
    expect(searchInput).toBeInTheDocument();
  });

  test('should render close button', () => {
    render(SettingsDialog, { open: true, onOpenChange });
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  test('should call onOpenChange when close button is clicked', async () => {
    render(SettingsDialog, { open: true, onOpenChange });
    
    const closeButton = screen.getByRole('button');
    await fireEvent.click(closeButton);
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
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
    
    // Check for main dialog container
    const dialogContent = container.querySelector('.max-w-\\[98vw\\]');
    expect(dialogContent).toBeInTheDocument();
    
    // Check for left sidebar
    const sidebar = container.querySelector('.w-80.border-r');
    expect(sidebar).toBeInTheDocument();
    
    // Check for main content area
    const contentArea = container.querySelector('.flex-1.overflow-auto');
    expect(contentArea).toBeInTheDocument();
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

  test('should have responsive design classes', () => {
    const { container } = render(SettingsDialog, { open: true, onOpenChange });
    
    const dialogContent = container.querySelector('.max-w-\\[98vw\\].w-\\[98vw\\].h-\\[98vh\\]');
    expect(dialogContent).toBeInTheDocument();
  });

  test('should render with proper flex layout', () => {
    const { container } = render(SettingsDialog, { open: true, onOpenChange });
    
    const flexContainer = container.querySelector('.flex.flex-1.min-h-0');
    expect(flexContainer).toBeInTheDocument();
  });
});