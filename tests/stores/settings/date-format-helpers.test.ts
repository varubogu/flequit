import { describe, expect, test, vi } from 'vitest';

const getLocaleMock = vi.hoisted(() => vi.fn(() => 'ja'));

vi.mock('$paraglide/runtime', () => ({
  getLocale: getLocaleMock
}));

import {
  buildAllDateFormats,
  getDefaultDateFormatForLocale,
  getStandardDateFormatsForLocale
} from '../../../src/lib/stores/settings/date-format-helpers';

describe('date-format-helpers', () => {
  test('getDefaultDateFormatForLocale respects locale', () => {
    expect(getDefaultDateFormatForLocale('ja')).toBe('yyyy年MM月dd日(E) HH:mm:ss');
    expect(getDefaultDateFormatForLocale('en')).toBe('EEEE, MMMM do, yyyy HH:mm:ss');
  });

  test('getStandardDateFormatsForLocale returns preset list', () => {
    const formats = getStandardDateFormatsForLocale('en');
    expect(formats.some((item) => item.id === 'iso')).toBe(true);
    expect(formats.every((item) => item.isStandard)).toBe(true);
  });

  test('buildAllDateFormats combines standard, custom, and placeholder entries', () => {
    getLocaleMock.mockReturnValue('en');
    const custom = [{ id: 'cf-1', name: 'Custom Format', format: 'yyyy/MM' }];

    const formats = buildAllDateFormats(custom);

    expect(formats.find((entry) => entry.id === 'standard')).toBeDefined();
    expect(formats.find((entry) => entry.id === 'cf-1')).toBeDefined();
    const placeholder = formats.find((entry) => entry.id === 'custom');
    expect(placeholder).toBeDefined();
    expect(placeholder?.isStandard).toBe(false);
  });
});
