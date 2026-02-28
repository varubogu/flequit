import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import SettingsCustomDueDaysSection from '$lib/components/settings/basic/settings-custom-due-days-section.svelte';
import { createUnitTestTranslationService } from '../../../unit-translation-mock';
import { getTranslationService, setTranslationService } from '$lib/stores/locale.svelte';

vi.mock('$lib/stores/settings.svelte', () => ({
  settingsStore: {},
  getAvailableTimezones: vi.fn(() => [])
}));

const originalTranslationService = getTranslationService();

describe('SettingsCustomDueDaysSection', () => {
  beforeEach(() => {
    setTranslationService(createUnitTestTranslationService());
  });

  afterAll(() => {
    setTranslationService(originalTranslationService);
  });

  it('カスタム期限日の追加セクションを表示する', () => {
    render(SettingsCustomDueDaysSection);

    expect(screen.getByText('TEST_ADD_CUSTOM_DUE_DATE_BUTTON')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TEST_ADD_CUSTOM_DUE_DATE' })).toBeInTheDocument();
  });

  it('追加ボタン押下でエラーにならない', async () => {
    render(SettingsCustomDueDaysSection);

    await expect(
      fireEvent.click(screen.getByRole('button', { name: 'TEST_ADD_CUSTOM_DUE_DATE' }))
    ).resolves.toBe(true);
  });
});
