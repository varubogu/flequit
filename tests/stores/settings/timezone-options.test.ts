import { describe, expect, test, vi } from 'vitest';

const messageFn = vi.hoisted(() => vi.fn(() => 'OS Timezone'));
const translationServiceMock = vi.hoisted(() => ({
  getMessage: vi.fn(() => messageFn)
}));

vi.mock('$lib/stores/locale.svelte', () => ({
  getTranslationService: vi.fn(() => translationServiceMock)
}));

import { getAvailableTimezones } from '../../../src/lib/stores/settings/timezone-options';

describe('timezone-options', () => {
  test('getAvailableTimezones returns predefined list with translated system label', () => {
    const timezones = getAvailableTimezones();

    expect(timezones[0]).toEqual({ value: 'system', label: 'OS Timezone' });
    expect(timezones.some((tz) => tz.value === 'Asia/Tokyo')).toBe(true);
  });
});
