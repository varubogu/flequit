import { describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/stores/settings.svelte');

describe('settings locale helpers', () => {
  it('uses the Japanese formats for a ja locale and the English formats otherwise', async () => {
    const { getDefaultDateFormat, getStandardDateFormats, getAllDateFormats } = await import(
      '$lib/stores/settings.svelte'
    );

    expect(getDefaultDateFormat('ja')).toBe('yyyy年MM月dd日(E) HH:mm:ss');
    expect(getDefaultDateFormat('ja-JP')).toContain('yyyy年');
    expect(getDefaultDateFormat('en')).toBe('EEEE, MMMM do, yyyy HH:mm:ss');
    expect(getStandardDateFormats('ja').map((format) => format.id)).toContain('iso');
    expect(getStandardDateFormats('en')[0]?.format).toContain('EEEE');
    expect(getAllDateFormats().some((format) => format.isStandard)).toBe(true);
  });

  it('falls back to the active locale when none is passed', async () => {
    const { getDefaultDateFormat, getStandardDateFormats } = await import('$lib/stores/settings.svelte');

    expect(getDefaultDateFormat()).toEqual(expect.any(String));
    expect(getStandardDateFormats().length).toBeGreaterThan(0);
  });
});
