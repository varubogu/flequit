import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SettingsAppearance from '$lib/components/settings/settings-appearance.svelte';
import { setTranslationService } from '$lib/stores/locale.svelte';
import {
  createUnitTestTranslationService,
  unitTestTranslations
} from '../../unit-translation-mock';

// Mock mode-watcher
vi.mock('mode-watcher', () => ({
  setMode: vi.fn(),
  systemPrefersMode: { current: 'light' },
  userPrefersMode: { current: 'system' }
}));

// Mock appearance store
vi.mock('$lib/stores/appearance-store.svelte', () => ({
  appearanceStore: {
    settings: {
      font: 'default',
      fontSize: 13,
      fontColor: 'default',
      backgroundColor: 'default'
    },
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setFontColor: vi.fn(),
    setBackgroundColor: vi.fn()
  }
}));

// Mock theme store
vi.mock('$lib/stores/theme-store.svelte', () => ({
  themeStore: {
    setTheme: vi.fn()
  }
}));

describe('SettingsAppearance Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTranslationService(createUnitTestTranslationService());
  });

  test('should render appearance settings section', () => {
    render(SettingsAppearance);

    expect(screen.getByText(unitTestTranslations.appearance_settings)).toBeInTheDocument();
  });

  test('should render theme selection', () => {
    render(SettingsAppearance);

    expect(screen.getByLabelText(unitTestTranslations.theme)).toBeInTheDocument();
    expect(screen.getByText(`${unitTestTranslations.system} (light)`)).toBeInTheDocument();
    expect(screen.getByText(unitTestTranslations.light)).toBeInTheDocument();
    expect(screen.getByText(unitTestTranslations.dark)).toBeInTheDocument();
  });

  test('should render font selection', () => {
    render(SettingsAppearance);

    const fontSelect = screen.getByLabelText(unitTestTranslations.font);
    expect(fontSelect).toBeInTheDocument();
    expect(screen.getAllByText(unitTestTranslations.default_font)).toHaveLength(3); // appears in 3 selects
    expect(screen.getByText(unitTestTranslations.system_font)).toBeInTheDocument();
    expect(screen.getByText('Arial')).toBeInTheDocument();
    expect(screen.getByText('Helvetica')).toBeInTheDocument();
  });

  test('should render font size input', () => {
    render(SettingsAppearance);

    const fontSizeInput = screen.getByLabelText(unitTestTranslations.font_size);
    expect(fontSizeInput).toBeInTheDocument();
    expect(fontSizeInput).toHaveAttribute('type', 'number');
    expect(fontSizeInput).toHaveValue(13); // number型なのでクォートを削除
  });

  test('should render font color selection', () => {
    render(SettingsAppearance);

    const fontColorSelect = screen.getByLabelText(unitTestTranslations.font_color);
    expect(fontColorSelect).toBeInTheDocument();
    expect(screen.getAllByText(unitTestTranslations.default_font)).toHaveLength(3); // appears in multiple selects
    expect(screen.getAllByText('Black')).toHaveLength(2); // appears in both font color and background color
    expect(screen.getAllByText('White')).toHaveLength(2); // appears in both font color and background color
  });

  test('should render background color selection', () => {
    render(SettingsAppearance);

    const backgroundColorSelect = screen.getByLabelText(unitTestTranslations.background_color);
    expect(backgroundColorSelect).toBeInTheDocument();
    expect(screen.getAllByText(unitTestTranslations.default_font)).toHaveLength(3); // appears in multiple selects
  });

  test('should call themeStore.setTheme when theme changes', async () => {
    const { themeStore } = await import('$lib/stores/theme-store.svelte');
    render(SettingsAppearance);

    const themeSelect = screen.getByLabelText(unitTestTranslations.theme);
    await fireEvent.change(themeSelect, { target: { value: 'dark' } });

    expect(themeStore.setTheme).toHaveBeenCalledWith('dark');
  });

  test('should call appearanceStore.setFont when font changes', async () => {
    const { appearanceStore } = await import('$lib/stores/appearance-store.svelte');
    render(SettingsAppearance);

    const fontSelect = screen.getByLabelText(unitTestTranslations.font);
    await fireEvent.change(fontSelect, { target: { value: 'arial' } });

    expect(appearanceStore.setFont).toHaveBeenCalledWith('arial');
  });

  test('should call appearanceStore.setFontSize when font size changes', async () => {
    const { appearanceStore } = await import('$lib/stores/appearance-store.svelte');
    render(SettingsAppearance);

    const fontSizeInput = screen.getByLabelText(unitTestTranslations.font_size);
    await fireEvent.input(fontSizeInput, { target: { value: '16' } });

    expect(appearanceStore.setFontSize).toHaveBeenCalledWith(16);
  });

  test('should call appearanceStore.setFontColor when font color changes', async () => {
    const { appearanceStore } = await import('$lib/stores/appearance-store.svelte');
    render(SettingsAppearance);

    const fontColorSelect = screen.getByLabelText(unitTestTranslations.font_color);
    await fireEvent.change(fontColorSelect, { target: { value: 'black' } });

    expect(appearanceStore.setFontColor).toHaveBeenCalledWith('black');
  });

  test('should call appearanceStore.setBackgroundColor when background color changes', async () => {
    const { appearanceStore } = await import('$lib/stores/appearance-store.svelte');
    render(SettingsAppearance);

    const backgroundColorSelect = screen.getByLabelText(unitTestTranslations.background_color);
    await fireEvent.change(backgroundColorSelect, { target: { value: 'white' } });

    expect(appearanceStore.setBackgroundColor).toHaveBeenCalledWith('white');
  });

  test('should have correct default values', () => {
    render(SettingsAppearance);

    const fontSelect = screen.getByLabelText(unitTestTranslations.font) as HTMLSelectElement;
    const fontSizeInput = screen.getByLabelText(unitTestTranslations.font_size) as HTMLInputElement;
    const fontColorSelect = screen.getByLabelText(unitTestTranslations.font_color) as HTMLSelectElement;
    const backgroundColorSelect = screen.getByLabelText(unitTestTranslations.background_color) as HTMLSelectElement;

    expect(fontSelect.value).toBe('default');
    expect(fontSizeInput.value).toBe('13');
    expect(fontColorSelect.value).toBe('default');
    expect(backgroundColorSelect.value).toBe('default');
  });

  test('should have responsive grid layout', () => {
    const { container } = render(SettingsAppearance);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
  });

  test('should render section with correct id', () => {
    const { container } = render(SettingsAppearance);

    const section = container.querySelector('#settings-appearance');
    expect(section).toBeInTheDocument();
  });
});