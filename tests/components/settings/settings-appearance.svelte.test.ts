import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsAppearance from '../../../src/lib/components/settings/settings-appearance.svelte';

// Mock mode-watcher
vi.mock('mode-watcher', () => ({
  setMode: vi.fn(),
  systemPrefersMode: { current: 'light' },
  userPrefersMode: { current: 'system' }
}));

describe('SettingsAppearance Component', () => {
  const defaultSettings = {
    font: 'default',
    fontSize: 13,
    fontColor: 'default',
    backgroundColor: 'default'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render appearance settings section', () => {
    render(SettingsAppearance, { settings: defaultSettings });
    
    expect(screen.getByText('Appearance Settings')).toBeInTheDocument();
  });

  test('should render theme selection', () => {
    render(SettingsAppearance, { settings: defaultSettings });
    
    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByText('System (light)')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  test('should render font selection', () => {
    render(SettingsAppearance, { settings: defaultSettings });
    
    const fontSelect = screen.getByLabelText('Font');
    expect(fontSelect).toBeInTheDocument();
    
    const options = fontSelect.querySelectorAll('option');
    expect(options[0]).toHaveTextContent('Default');
    expect(options[1]).toHaveTextContent('System');
    expect(options[2]).toHaveTextContent('Arial');
    expect(options[3]).toHaveTextContent('Helvetica');
  });

  test('should render font size input', () => {
    render(SettingsAppearance, { settings: defaultSettings });
    
    const fontSizeInput = screen.getByLabelText('Font Size');
    expect(fontSizeInput).toBeInTheDocument();
    expect(fontSizeInput).toHaveAttribute('type', 'number');
    expect(fontSizeInput).toHaveAttribute('min', '10');
    expect(fontSizeInput).toHaveAttribute('max', '24');
  });

  test('should render font color selection', () => {
    render(SettingsAppearance, { settings: defaultSettings });
    
    const fontColorSelect = screen.getByLabelText('Font Color');
    expect(fontColorSelect).toBeInTheDocument();
    
    const options = fontColorSelect.querySelectorAll('option');
    expect(options[0]).toHaveTextContent('Default');
    expect(options[1]).toHaveTextContent('Black');
    expect(options[2]).toHaveTextContent('White');
  });

  test('should render background color selection', () => {
    render(SettingsAppearance, { settings: defaultSettings });
    
    const backgroundColorSelect = screen.getByLabelText('Background Color');
    expect(backgroundColorSelect).toBeInTheDocument();
    
    const options = backgroundColorSelect.querySelectorAll('option');
    expect(options[0]).toHaveTextContent('Default');
    expect(options[1]).toHaveTextContent('White');
    expect(options[2]).toHaveTextContent('Black');
  });

  test('should render font select with correct value', () => {
    const settings = { ...defaultSettings, font: 'arial' };
    render(SettingsAppearance, { settings });
    
    const fontSelect = screen.getByLabelText('Font') as HTMLSelectElement;
    expect(fontSelect.value).toBe('arial');
  });

  test('should render font size input with correct value', () => {
    const settings = { ...defaultSettings, fontSize: 16 };
    render(SettingsAppearance, { settings });
    
    const fontSizeInput = screen.getByLabelText('Font Size') as HTMLInputElement;
    expect(fontSizeInput.value).toBe('16');
  });

  test('should render font color select with correct value', () => {
    const settings = { ...defaultSettings, fontColor: 'black' };
    render(SettingsAppearance, { settings });
    
    const fontColorSelect = screen.getByLabelText('Font Color') as HTMLSelectElement;
    expect(fontColorSelect.value).toBe('black');
  });

  test('should render background color select with correct value', () => {
    const settings = { ...defaultSettings, backgroundColor: 'white' };
    render(SettingsAppearance, { settings });
    
    const backgroundColorSelect = screen.getByLabelText('Background Color') as HTMLSelectElement;
    expect(backgroundColorSelect.value).toBe('white');
  });

  test('should call setMode when theme is changed', async () => {
    const { setMode } = await import('mode-watcher');
    render(SettingsAppearance, { settings: defaultSettings });
    
    const themeSelect = screen.getByLabelText('Theme');
    await fireEvent.change(themeSelect, { target: { value: 'dark' } });
    
    expect(setMode).toHaveBeenCalledWith('dark');
  });

  test('should have correct default values', () => {
    render(SettingsAppearance, { settings: defaultSettings });
    
    const fontSelect = screen.getByLabelText('Font') as HTMLSelectElement;
    const fontSizeInput = screen.getByLabelText('Font Size') as HTMLInputElement;
    const fontColorSelect = screen.getByLabelText('Font Color') as HTMLSelectElement;
    const backgroundColorSelect = screen.getByLabelText('Background Color') as HTMLSelectElement;
    
    expect(fontSelect.value).toBe('default');
    expect(fontSizeInput.value).toBe('13');
    expect(fontColorSelect.value).toBe('default');
    expect(backgroundColorSelect.value).toBe('default');
  });

  test('should have responsive grid layout', () => {
    const { container } = render(SettingsAppearance, { settings: defaultSettings });
    
    const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
  });

  test('should render section with correct id', () => {
    const { container } = render(SettingsAppearance, { settings: defaultSettings });
    
    const section = container.querySelector('#settings-appearance');
    expect(section).toBeInTheDocument();
  });
});